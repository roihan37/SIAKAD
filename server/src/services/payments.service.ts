import { Prisma, StatusPembayaran } from '@prisma/client';
import { PaymentFilters } from '../validation/payments';

const paymentSelect = {
  id: true, nomorPembayaran: true, nominal: true, metode: true, sumber: true, paidAt: true, status: true,
  tagihan: { select: {
    id: true, nomorTagihan: true, nominal: true, jatuhTempo: true, status: true,
    tahunAkademik: { select: { id: true, tahun: true, semester: true } },
    mahasiswa: { select: { id: true, userId: true, nim: true, user: { select: { name: true } }, prodi: { select: { id: true, name: true } } } },
  } },
} satisfies Prisma.PembayaranUKTSelect;
type PaymentRow = Prisma.PembayaranUKTGetPayload<{ select: typeof paymentSelect }>;
function paymentResponse(row: PaymentRow) {
  const student = row.tagihan.mahasiswa;
  return {
    id: row.id, paymentNumber: row.nomorPembayaran,
    student: { userId: student.userId, studentId: student.id, nim: student.nim, name: student.user.name, studyProgram: student.prodi },
    // This API currently reads tuition bills exclusively; there is no bill-type column.
    bill: { id: row.tagihan.id, billNumber: row.tagihan.nomorTagihan, type: 'UKT' },
    amount: Number(row.nominal), method: row.metode, source: row.sumber, paidAt: row.paidAt, status: row.status,
  };
}
export function paymentWhere(filters: PaymentFilters, includeStatus = true): Prisma.PembayaranUKTWhereInput {
  return {
    metode: filters.method, ...(includeStatus ? { status: filters.status } : {}),
    tagihan: { tahunAkademikId: filters.academicYearId, mahasiswa: { prodiId: filters.studyProgramId } },
    ...(filters.startDate || filters.endDate ? { createdAt: { gte: filters.startDate, lte: filters.endDate } } : {}),
    ...(filters.search ? { OR: [
      { nomorPembayaran: { contains: filters.search, mode: 'insensitive' as const } },
      { reference: { contains: filters.search, mode: 'insensitive' as const } },
      { tagihan: { nomorTagihan: { contains: filters.search, mode: 'insensitive' as const } } },
      { tagihan: { mahasiswa: { nim: { contains: filters.search, mode: 'insensitive' as const } } } },
      { tagihan: { mahasiswa: { user: { name: { contains: filters.search, mode: 'insensitive' as const } } } } },
    ] } : {}),
  };
}
export async function listPayments(tx: Prisma.TransactionClient, filters: PaymentFilters) {
  const where = paymentWhere(filters);
  const [groups, totalRows, rows] = await Promise.all([
    tx.pembayaranUKT.groupBy({ by: ['status'], where: paymentWhere(filters, false), _count: { _all: true }, _sum: { nominal: true } }),
    tx.pembayaranUKT.count({ where }),
    tx.pembayaranUKT.findMany({ where, select: paymentSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (filters.page - 1) * filters.limit, take: filters.limit }),
  ]);
  const successful = groups.find(group => group.status === 'SUCCESS');
  return {
    summary: {
      totalSuccessfulAmount: Number(successful?._sum.nominal ?? 0), successfulTransactions: successful?._count._all ?? 0,
      pendingTransactions: groups.find(group => group.status === 'PENDING')?._count._all ?? 0,
      failedTransactions: groups.find(group => group.status === 'FAILED')?._count._all ?? 0,
    },
    payments: rows.map(paymentResponse),
    pagination: { page: filters.page, limit: filters.limit, totalRows, totalPages: Math.ceil(totalRows / filters.limit) },
  };
}
export async function paymentDetail(tx: Prisma.TransactionClient, id: string) {
  const row = await tx.pembayaranUKT.findUnique({ where: { id }, select: {
    ...paymentSelect, reference: true, buktiPembayaranKey: true, verifiedAt: true, verifiedById: true, createdAt: true,
    riwayatStatus: { orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], select: { id: true, statusLama: true, statusBaru: true, alasan: true, actorId: true, createdAt: true } },
  } });
  if (!row) throw { name: 'NotFound', message: 'Payment not found.' };
  return {
    proofKey: row.buktiPembayaranKey,
    data: {
      ...paymentResponse(row),
      bill: { id: row.tagihan.id, billNumber: row.tagihan.nomorTagihan, type: 'UKT', amount: Number(row.tagihan.nominal), dueDate: row.tagihan.jatuhTempo, status: row.tagihan.status,
        academicYear: { id: row.tagihan.tahunAkademik.id, year: row.tagihan.tahunAkademik.tahun, semester: row.tagihan.tahunAkademik.semester } },
      reference: row.reference, verifiedAt: row.verifiedAt, verifiedById: row.verifiedById, createdAt: row.createdAt,
      statusHistory: row.riwayatStatus.map(history => ({ id: history.id, previousStatus: history.statusLama, newStatus: history.statusBaru, reason: history.alasan, actorId: history.actorId, createdAt: history.createdAt })),
    },
  };
}
export async function recalculateTuitionBill(tx: Prisma.TransactionClient, billId: string) {
  const [bill, payments] = await Promise.all([
    tx.tagihanUKT.findUnique({ where: { id: billId }, select: { nominal: true } }),
    tx.pembayaranUKT.aggregate({ where: { tagihanId: billId, status: 'SUCCESS' }, _sum: { nominal: true } }),
  ]);
  if (!bill) throw { name: 'NotFound', message: 'Tuition bill not found.' };
  const paid = payments._sum.nominal ?? new Prisma.Decimal(0);
  const status = paid.isZero() ? 'BELUM_DIBAYAR' : paid.lt(bill.nominal) ? 'SEBAGIAN' : 'LUNAS';
  await tx.tagihanUKT.update({ where: { id: billId }, data: { status } });
  return status;
}
export async function changePaymentStatus(tx: Prisma.TransactionClient, id: string, actorId: string, action: 'APPROVE' | 'REJECT' | 'CANCEL', reason?: string) {
  const payment = await tx.pembayaranUKT.findUnique({ where: { id }, select: { id: true, tagihanId: true, status: true, paidAt: true } });
  if (!payment) throw { name: 'NotFound', message: 'Payment not found.' };
  // Successful payments require a separate reversal/refund workflow, which is not defined here.
  if (payment.status !== 'PENDING') throw { name: 'Conflict', message: 'Only pending payments can be verified or cancelled.' };
  const now = new Date();
  const status: StatusPembayaran = action === 'APPROVE' ? 'SUCCESS' : action === 'REJECT' ? 'FAILED' : 'CANCELLED';
  const updated = await tx.pembayaranUKT.updateMany({ where: { id, status: 'PENDING' }, data: {
    status,
    ...(action === 'CANCEL' ? {} : { verifiedAt: now, verifiedById: actorId }),
    ...(action === 'APPROVE' ? { paidAt: payment.paidAt ?? now } : {}),
  } });
  if (updated.count !== 1) throw { name: 'Conflict', message: 'Payment status has changed. Reload before trying again.' };
  await tx.riwayatStatusPembayaran.create({ data: { pembayaranId: id, statusLama: payment.status, statusBaru: status, alasan: reason ?? null, actorId, createdAt: now } });
  if (status === 'SUCCESS') await recalculateTuitionBill(tx, payment.tagihanId);
  return { id, status };
}
