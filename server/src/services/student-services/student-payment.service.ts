import { randomUUID } from "node:crypto";
import { Prisma, StatusPembayaran } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import {
  MidtransService,
  parseMidtransNotification,
  type MidtransNotification,
  type MidtransSnapInput,
  type MidtransSnapResult,
} from "../midtrans.service";
import { recalculateTuitionBill } from "../payments.service";

const MIDTRANS_PROVIDER = "MIDTRANS";
const PAYMENT_EXPIRY_HOURS = 24;

export interface PaymentGateway {
  createSnapTransaction(input: MidtransSnapInput): Promise<MidtransSnapResult>;
  verifyNotification(notification: MidtransNotification): void;
}

const studentPaymentSelect = {
  id: true,
  nomorPembayaran: true,
  nominal: true,
  metode: true,
  status: true,
  sumber: true,
  reference: true,
  provider: true,
  providerOrderId: true,
  providerTransactionId: true,
  providerToken: true,
  providerRedirectUrl: true,
  expiresAt: true,
  paidAt: true,
  createdAt: true,
  tagihan: {
    select: {
      id: true,
      nomorTagihan: true,
      nominal: true,
      jatuhTempo: true,
      status: true,
      mahasiswa: { select: { userId: true } },
      tahunAkademik: { select: { id: true, tahun: true, semester: true } },
    },
  },
} satisfies Prisma.PembayaranUKTSelect;

type StudentPaymentRow = Prisma.PembayaranUKTGetPayload<{ select: typeof studentPaymentSelect }>;
type PreparedPayment =
  | { kind: "reuse"; payment: StudentPaymentRow }
  | { kind: "create"; payment: StudentPaymentRow; gatewayInput: MidtransSnapInput }
  | { kind: "paid" };

function paymentResponse(row: StudentPaymentRow) {
  return {
    id: row.id,
    paymentNumber: row.nomorPembayaran,
    amount: Number(row.nominal),
    method: row.metode,
    status: row.status,
    source: row.sumber,
    reference: row.reference,
    provider: row.provider,
    providerOrderId: row.providerOrderId,
    providerTransactionId: row.providerTransactionId,
    snapToken: row.providerToken,
    redirectUrl: row.providerRedirectUrl,
    expiresAt: row.expiresAt,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    bill: {
      id: row.tagihan.id,
      billNumber: row.tagihan.nomorTagihan,
      amount: Number(row.tagihan.nominal),
      dueDate: row.tagihan.jatuhTempo,
      status: row.tagihan.status,
      academicYear: {
        id: row.tagihan.tahunAkademik.id,
        year: row.tagihan.tahunAkademik.tahun,
        semester: row.tagihan.tahunAkademik.semester,
      },
    },
  };
}

function gatewayPaymentWhere(userId: string): Prisma.PembayaranUKTWhereInput {
  return {
    sumber: "PAYMENT_GATEWAY",
    provider: MIDTRANS_PROVIDER,
    tagihan: { mahasiswa: { userId } },
  };
}

function exactRupiahAmount(amount: Prisma.Decimal): number {
  if (!amount.isInteger() || amount.lte(0) || amount.gt(Number.MAX_SAFE_INTEGER)) {
    throw new AppError(409, "INVALID_PAYMENT_AMOUNT", "The outstanding bill amount cannot be processed by Midtrans.");
  }
  return amount.toNumber();
}

export function mapMidtransStatus(transactionStatus: string, fraudStatus: string | null): StatusPembayaran {
  switch (transactionStatus) {
    case "settlement":
      return "SUCCESS";
    case "capture":
      if (fraudStatus === "accept") return "SUCCESS";
      if (fraudStatus === "deny") return "FAILED";
      return "PENDING";
    case "pending":
    case "authorize":
      return "PENDING";
    case "expire":
      return "EXPIRED";
    case "cancel":
      return "CANCELLED";
    case "deny":
    case "failure":
    case "refund":
    case "partial_refund":
    case "chargeback":
      return "FAILED";
    default:
      throw new AppError(400, "UNSUPPORTED_MIDTRANS_STATUS", "Midtrans transaction status is not supported.");
  }
}

function shouldApplyStatus(current: StatusPembayaran, incoming: StatusPembayaran): boolean {
  if (current === incoming) return false;
  if (incoming === "SUCCESS") return true;
  if (current === "SUCCESS") return false;
  if (current !== "PENDING") return false;
  return true;
}

export class StudentPaymentService {
  static async createPayment(
    userId: string,
    billId: string,
    gateway: PaymentGateway = MidtransService.fromEnvironment(),
  ) {
    const now = new Date();
    let prepared: PreparedPayment;
    try {
      prepared = await prisma.$transaction(async (tx) => {
        const bill = await tx.tagihanUKT.findFirst({
          where: { id: billId, mahasiswa: { userId } },
          select: {
            id: true,
            nomorTagihan: true,
            nominal: true,
            status: true,
            mahasiswa: { select: { user: { select: { name: true, email: true, phoneNumber: true } } } },
          },
        });
        if (!bill) throw new AppError(404, "BILL_NOT_FOUND", "Tuition bill not found.");

        const successful = await tx.pembayaranUKT.aggregate({
          where: { tagihanId: bill.id, status: "SUCCESS" },
          _sum: { nominal: true },
        });
        const remaining = Prisma.Decimal.max(
          bill.nominal.minus(successful._sum.nominal ?? new Prisma.Decimal(0)),
          0,
        );
        if (bill.status === "LUNAS" || remaining.isZero()) {
          await recalculateTuitionBill(tx, bill.id);
          return { kind: "paid" };
        }

        const pending = await tx.pembayaranUKT.findFirst({
          where: { tagihanId: bill.id, status: "PENDING", sumber: "PAYMENT_GATEWAY" },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          select: studentPaymentSelect,
        });
        if (pending && pending.expiresAt && pending.expiresAt > now) {
          if (!pending.providerToken || !pending.providerRedirectUrl) {
            throw new AppError(409, "PAYMENT_CREATION_IN_PROGRESS", "A payment transaction is being prepared. Please try again shortly.");
          }
          return { kind: "reuse", payment: pending };
        }
        if (pending) {
          await tx.pembayaranUKT.update({ where: { id: pending.id }, data: { status: "EXPIRED" } });
          await tx.riwayatStatusPembayaran.create({
            data: {
              pembayaranId: pending.id,
              statusLama: "PENDING",
              statusBaru: "EXPIRED",
              alasan: "Midtrans payment window expired before a new transaction was created.",
            },
          });
        }

        const amount = exactRupiahAmount(remaining);
        const identifier = randomUUID();
        const orderId = `UKT-${identifier}`;
        const expiresAt = new Date(now.getTime() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
        const created = await tx.pembayaranUKT.create({
          data: {
            tagihanId: bill.id,
            nomorPembayaran: `PAY-${identifier}`,
            nominal: remaining,
            metode: "VIRTUAL_ACCOUNT",
            status: "PENDING",
            sumber: "PAYMENT_GATEWAY",
            reference: orderId,
            provider: MIDTRANS_PROVIDER,
            providerOrderId: orderId,
            expiresAt,
            riwayatStatus: { create: { statusLama: null, statusBaru: "PENDING", alasan: "Midtrans Snap transaction created." } },
          },
          select: studentPaymentSelect,
        });

        return {
          kind: "create",
          payment: created,
          gatewayInput: {
            orderId,
            grossAmount: amount,
            expiresAt,
            customer: {
              name: bill.mahasiswa.user.name,
              email: bill.mahasiswa.user.email,
              phone: bill.mahasiswa.user.phoneNumber,
            },
            item: { id: bill.id, name: `UKT ${bill.nomorTagihan}` },
          } satisfies MidtransSnapInput,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.pembayaranUKT.findFirst({
          where: { ...gatewayPaymentWhere(userId), tagihanId: billId, status: "PENDING", expiresAt: { gt: now } },
          select: studentPaymentSelect,
        });
        if (existing?.providerToken && existing.providerRedirectUrl) {
          return { reused: true, payment: paymentResponse(existing) };
        }
        throw new AppError(409, "PAYMENT_CREATION_IN_PROGRESS", "A payment transaction is being prepared. Please try again shortly.");
      }
      throw error;
    }

    if (prepared.kind === "paid") {
      throw new AppError(409, "BILL_ALREADY_PAID", "This tuition bill has already been paid in full.");
    }
    if (prepared.kind === "reuse") {
      return { reused: true, payment: paymentResponse(prepared.payment) };
    }

    try {
      const snap = await gateway.createSnapTransaction(prepared.gatewayInput);
      const updated = await prisma.pembayaranUKT.update({
        where: { id: prepared.payment.id },
        data: { providerToken: snap.token, providerRedirectUrl: snap.redirectUrl },
        select: studentPaymentSelect,
      });
      return { reused: false, payment: paymentResponse(updated) };
    } catch (error) {
      await prisma.$transaction(async (tx) => {
        const failed = await tx.pembayaranUKT.updateMany({
          where: { id: prepared.payment.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
        if (failed.count === 1) {
          await tx.riwayatStatusPembayaran.create({
            data: {
              pembayaranId: prepared.payment.id,
              statusLama: "PENDING",
              statusBaru: "FAILED",
              alasan: "Midtrans Snap transaction creation failed.",
            },
          });
        }
      });
      throw error;
    }
  }

  static async getPayment(userId: string, paymentId: string) {
    const payment = await prisma.pembayaranUKT.findFirst({
      where: { id: paymentId, tagihan: { mahasiswa: { userId } } },
      select: studentPaymentSelect,
    });
    if (!payment) throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    return paymentResponse(payment);
  }

  static async handleMidtransWebhook(
    body: unknown,
    gateway: PaymentGateway = MidtransService.fromEnvironment(),
  ) {
    const notification = parseMidtransNotification(body);
    gateway.verifyNotification(notification);
    const incomingStatus = mapMidtransStatus(notification.transactionStatus, notification.fraudStatus);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.pembayaranUKT.findUnique({
        where: { providerOrderId: notification.orderId },
        select: {
          id: true,
          tagihanId: true,
          nominal: true,
          status: true,
          sumber: true,
          provider: true,
          providerTransactionId: true,
          paidAt: true,
        },
      });
      if (!payment || payment.sumber !== "PAYMENT_GATEWAY" || payment.provider !== MIDTRANS_PROVIDER) {
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Midtrans payment was not found.");
      }
      if (!payment.nominal.equals(new Prisma.Decimal(notification.grossAmount))) {
        throw new AppError(409, "PAYMENT_AMOUNT_MISMATCH", "Midtrans payment amount does not match the recorded amount.");
      }
      if (
        payment.providerTransactionId && notification.transactionId &&
        payment.providerTransactionId !== notification.transactionId
      ) {
        throw new AppError(409, "PAYMENT_REFERENCE_MISMATCH", "Midtrans transaction reference does not match the recorded payment.");
      }

      const applyStatus = shouldApplyStatus(payment.status, incomingStatus);
      const transactionId = payment.providerTransactionId ?? notification.transactionId;
      if (applyStatus || transactionId !== payment.providerTransactionId) {
        await tx.pembayaranUKT.update({
          where: { id: payment.id },
          data: {
            ...(applyStatus ? {
              status: incomingStatus,
              paidAt: incomingStatus === "SUCCESS" ? (payment.paidAt ?? notification.settlementTime ?? new Date()) : null,
            } : {}),
            ...(transactionId ? { providerTransactionId: transactionId } : {}),
          },
        });
      }

      if (applyStatus) {
        await tx.riwayatStatusPembayaran.create({
          data: {
            pembayaranId: payment.id,
            statusLama: payment.status,
            statusBaru: incomingStatus,
            alasan: `Midtrans notification: ${notification.transactionStatus}`,
          },
        });
        if (payment.status === "SUCCESS" || incomingStatus === "SUCCESS") {
          await recalculateTuitionBill(tx, payment.tagihanId);
        }
      }

      return { received: true, paymentId: payment.id, status: applyStatus ? incomingStatus : payment.status };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
