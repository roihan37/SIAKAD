import { createHash, timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/app-error";
import { getMidtransEnv, type MidtransEnv } from "../config/env";

const REQUEST_TIMEOUT_MS = 10_000;

export interface MidtransSnapInput {
  orderId: string;
  grossAmount: number;
  expiresAt: Date;
  customer: { name: string; email: string; phone?: string | null };
  item: { id: string; name: string };
}

export interface MidtransSnapResult {
  token: string;
  redirectUrl: string;
}

export interface MidtransNotification {
  orderId: string;
  transactionId: string | null;
  transactionStatus: string;
  fraudStatus: string | null;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  settlementTime: Date | null;
}

export type MidtransTransactionStatus = Omit<MidtransNotification, "signatureKey">;

function requiredString(input: Record<string, unknown>, key: string, max = 255): string {
  const value = input[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new AppError(400, "INVALID_MIDTRANS_NOTIFICATION", `Midtrans notification field ${key} is invalid.`);
  }
  return value;
}

function requiredResponseString(input: Record<string, unknown>, key: string, max = 255): string {
  const value = input[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new AppError(502, "INVALID_MIDTRANS_RESPONSE", "Midtrans returned an invalid transaction status.");
  }
  return value.trim();
}

function optionalString(input: Record<string, unknown>, key: string, max = 255): string | null {
  const value = input[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max) {
    throw new AppError(400, "INVALID_MIDTRANS_NOTIFICATION", `Midtrans notification field ${key} is invalid.`);
  }
  return value;
}

function optionalResponseString(input: Record<string, unknown>, key: string, max = 255): string | null {
  const value = input[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max) {
    throw new AppError(502, "INVALID_MIDTRANS_RESPONSE", "Midtrans returned an invalid transaction status.");
  }
  return value;
}

function midtransTimestamp(value: string | null): Date | null {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}+07:00`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseMidtransNotification(body: unknown): MidtransNotification {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "INVALID_MIDTRANS_NOTIFICATION", "Midtrans notification must be a JSON object.");
  }
  const input = body as Record<string, unknown>;
  const grossAmount = requiredString(input, "gross_amount", 40);
  if (!/^\d+(?:\.\d{1,2})?$/.test(grossAmount)) {
    throw new AppError(400, "INVALID_MIDTRANS_NOTIFICATION", "Midtrans gross_amount is invalid.");
  }
  const settlementTime = optionalString(input, "settlement_time", 40);
  return {
    orderId: requiredString(input, "order_id", 100),
    transactionId: optionalString(input, "transaction_id", 100),
    transactionStatus: requiredString(input, "transaction_status", 40).toLowerCase(),
    fraudStatus: optionalString(input, "fraud_status", 40)?.toLowerCase() ?? null,
    statusCode: requiredString(input, "status_code", 10),
    grossAmount,
    signatureKey: requiredString(input, "signature_key", 256).toLowerCase(),
    settlementTime: midtransTimestamp(settlementTime),
  };
}

export function parseMidtransTransactionStatus(body: unknown): MidtransTransactionStatus {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(502, "INVALID_MIDTRANS_RESPONSE", "Midtrans returned an invalid transaction status.");
  }
  const input = body as Record<string, unknown>;
  const grossAmount = requiredResponseString(input, "gross_amount", 40);
  if (!/^\d+(?:\.\d{1,2})?$/.test(grossAmount)) {
    throw new AppError(502, "INVALID_MIDTRANS_RESPONSE", "Midtrans returned an invalid transaction amount.");
  }
  const settlementTime = optionalResponseString(input, "settlement_time", 40);
  return {
    orderId: requiredResponseString(input, "order_id", 100),
    transactionId: optionalResponseString(input, "transaction_id", 100),
    transactionStatus: requiredResponseString(input, "transaction_status", 40).toLowerCase(),
    fraudStatus: optionalResponseString(input, "fraud_status", 40)?.toLowerCase() ?? null,
    statusCode: requiredResponseString(input, "status_code", 10),
    grossAmount,
    settlementTime: midtransTimestamp(settlementTime),
  };
}

export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`, "utf8").digest("hex");
}

export function verifyMidtransSignature(notification: MidtransNotification, serverKey: string): boolean {
  const expected = Buffer.from(midtransSignature(notification.orderId, notification.statusCode, notification.grossAmount, serverKey), "utf8");
  const actual = Buffer.from(notification.signatureKey, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function snapStartTime(date: Date): string {
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19).replace("T", " ")} +0700`;
}

export class MidtransService {
  constructor(private readonly config: Readonly<MidtransEnv>) {}

  static fromEnvironment(): MidtransService {
    return new MidtransService(getMidtransEnv());
  }

  verifyNotification(notification: MidtransNotification): void {
    if (!verifyMidtransSignature(notification, this.config.serverKey)) {
      throw new AppError(401, "INVALID_MIDTRANS_SIGNATURE", "Midtrans notification signature is invalid.");
    }
  }

  async getTransactionStatus(orderId: string): Promise<MidtransTransactionStatus> {
    const baseUrl = this.config.isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
    let response: globalThis.Response;
    try {
      response = await fetch(`${baseUrl}/v2/${encodeURIComponent(orderId)}/status`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.serverKey}:`).toString("base64")}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new AppError(503, "PAYMENT_PROVIDER_UNAVAILABLE", "Midtrans is temporarily unavailable.");
    }
    if (!response.ok) {
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Midtrans could not confirm the transaction status.");
    }
    return parseMidtransTransactionStatus(await response.json());
  }

  async createSnapTransaction(input: MidtransSnapInput): Promise<MidtransSnapResult> {
    const baseUrl = this.config.isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
    let response: globalThis.Response;
    try {
      response = await fetch(`${baseUrl}/snap/v1/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.serverKey}:`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
          enabled_payments: ["bank_transfer", "echannel", "permata_va"],
          customer_details: {
            first_name: input.customer.name,
            email: input.customer.email,
            ...(input.customer.phone ? { phone: input.customer.phone } : {}),
          },
          item_details: [{ id: input.item.id, price: input.grossAmount, quantity: 1, name: input.item.name.slice(0, 50) }],
          expiry: { start_time: snapStartTime(new Date()), unit: "hour", duration: 24 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new AppError(503, "PAYMENT_PROVIDER_UNAVAILABLE", "Midtrans is temporarily unavailable.");
    }
    if (!response.ok) {
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Midtrans rejected the payment transaction.");
    }
    const body = await response.json() as { token?: unknown; redirect_url?: unknown };
    if (typeof body.token !== "string" || !body.token || typeof body.redirect_url !== "string" || !body.redirect_url) {
      throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Midtrans returned an invalid transaction response.");
    }
    return { token: body.token, redirectUrl: body.redirect_url };
  }
}
