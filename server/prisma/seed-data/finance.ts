import { Prisma, StatusPembayaran } from "@prisma/client";

// Fixed September 2026 snapshot, matching the academic seed.
export async function seedStudentFinance(tx: Prisma.TransactionClient, student: { id: string; nim: string }, years: { id: number }[], programIndex: number, studentIndex: number, adminId: string) {
  const nominal = new Prisma.Decimal(programIndex === 0 ? 5000000 : 4000000);
  for (const [periodIndex, year] of years.entries()) {
    if (periodIndex === 1 && studentIndex === 7) continue; // Cuti: no current tuition bill.
    const nomorTagihan = `UKT-SEED-2026-${periodIndex + 1}-${student.nim}`;
    const identity = { mahasiswaId: student.id, tahunAkademikId: year.id };
    const existing = await tx.tagihanUKT.findUnique({ where: { mahasiswaId_tahunAkademikId: identity } });
    // Do not overwrite bills/payments created through the application.
    if (existing && existing.nomorTagihan !== nomorTagihan) continue;
    if (existing) {
      const payments = await tx.pembayaranUKT.findMany({ where: { tagihanId: existing.id } });
      if (payments.some(payment => !payment.nomorPembayaran.startsWith(`PAY-SEED-${nomorTagihan}-`))) continue;
      const history = await tx.riwayatStatusPembayaran.findMany({ where: { pembayaranId: { in: payments.map(payment => payment.id) } } });
      if (history.some(entry => !entry.alasan?.startsWith('[Seed]'))) continue;
    }
    const historical = periodIndex === 0;
    const status = historical || studentIndex <= 2 ? "LUNAS" : studentIndex === 3 ? "SEBAGIAN" : studentIndex === 5 ? "JATUH_TEMPO" : "BELUM_DIBAYAR";
    const due = historical ? "2026-02-10" : studentIndex === 5 ? "2026-09-10" : "2026-09-30";
    const data = { nomorTagihan, nominal, jatuhTempo: new Date(`${due}T23:59:59.999+07:00`), status } as const;
    const bill = await tx.tagihanUKT.upsert({ where: { mahasiswaId_tahunAkademikId: identity }, update: data, create: { ...identity, ...data } });
    const payment = async (sequence: number, amount: Prisma.Decimal, paymentStatus: StatusPembayaran, date: string) => {
      const nomorPembayaran = `PAY-SEED-${nomorTagihan}-${sequence}`;
      const timestamp = new Date(`${date}T10:00:00+07:00`);
      const values = {
        tagihanId: bill.id, nominal: amount, status: paymentStatus,
        metode: studentIndex === 2 ? "CASH" as const : studentIndex % 2 === 0 ? "VIRTUAL_ACCOUNT" as const : "TRANSFER_BANK" as const,
        sumber: studentIndex % 2 === 0 && studentIndex !== 2 ? "PAYMENT_GATEWAY" as const : "MANUAL" as const,
        verifiedAt: (paymentStatus === "SUCCESS" || paymentStatus === "FAILED") && (studentIndex % 2 !== 0 || studentIndex === 2) ? timestamp : null,
        verifiedById: (paymentStatus === "SUCCESS" || paymentStatus === "FAILED") && (studentIndex % 2 !== 0 || studentIndex === 2) ? adminId : null,
        paidAt: paymentStatus === "SUCCESS" ? timestamp : null,
        reference: `DEMO-${student.nim}-${periodIndex}-${sequence}`, createdAt: timestamp,
      };
      const saved = await tx.pembayaranUKT.upsert({ where: { nomorPembayaran }, update: values, create: { nomorPembayaran, ...values } });
      await tx.riwayatStatusPembayaran.deleteMany({ where: { pembayaranId: saved.id, alasan: { startsWith: '[Seed]' } } });
      await tx.riwayatStatusPembayaran.create({ data: {
        pembayaranId: saved.id, statusLama: null, statusBaru: 'PENDING', alasan: '[Seed] Payment submitted.', actorId: null,
        createdAt: new Date(timestamp.getTime() - 3600000),
      } });
      if (paymentStatus !== 'PENDING') await tx.riwayatStatusPembayaran.create({ data: {
        pembayaranId: saved.id, statusLama: 'PENDING', statusBaru: paymentStatus,
        alasan: paymentStatus === 'FAILED' ? '[Seed] Payment could not be confirmed.' : paymentStatus === 'CANCELLED' ? '[Seed] Duplicate payment request cancelled.' : paymentStatus === 'EXPIRED' ? '[Seed] Payment window expired.' : '[Seed] Payment confirmed.',
        actorId: values.sumber === 'MANUAL' || paymentStatus === 'CANCELLED' ? adminId : null, createdAt: timestamp,
      } });
    };
    if (historical) await payment(1, nominal, "SUCCESS", "2026-02-05");
    else if (studentIndex === 1) {
      await payment(1, nominal.div(2), "SUCCESS", "2026-09-02");
      await payment(2, nominal.div(2), "SUCCESS", "2026-09-12");
    } else if (studentIndex <= 2) await payment(1, nominal, "SUCCESS", "2026-09-03");
    else if (studentIndex === 3) {
      await payment(1, nominal.div(2), "SUCCESS", "2026-09-04");
      await payment(2, nominal.div(2), "PENDING", "2026-09-14");
    } else if (studentIndex === 4) await payment(1, nominal, "FAILED", "2026-09-13");
    else if (studentIndex === 5) await payment(1, nominal.div(2), "SUCCESS", "2026-09-05");
    else {
      await payment(1, nominal, "PENDING", "2026-09-14");
      await payment(2, nominal, programIndex === 0 ? "CANCELLED" : "EXPIRED", "2026-09-12");
    }
  }
}
