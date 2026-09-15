import { Prisma } from "@prisma/client";
import { billListQuery } from "../validation/tuition";

const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });

function tuitionBalance(amount: Prisma.Decimal, payments: { nominal: Prisma.Decimal }[], dueDate: Date, now: Date) {
  const paid = payments.reduce((sum, payment) => sum.plus(payment.nominal), new Prisma.Decimal(0));
  const remaining = Prisma.Decimal.max(amount.minus(paid), 0);
  const status = remaining.isZero() ? "LUNAS" : dueDate < now ? "JATUH_TEMPO" : paid.gt(0) ? "SEBAGIAN" : "BELUM_DIBAYAR";
  return { paid, remaining, status };
}

export async function getStudentFinance(tx: Prisma.TransactionClient, userId: string, tahunAkademikId: number | undefined, now: Date) {
  const student = await tx.mahasiswa.findUnique({ where: { userId }, select: { id: true } });
  if (!student) throw { name: "NotFound", message: "Mahasiswa tidak ditemukan." };
  if (tahunAkademikId !== undefined) {
    const year = await tx.tahunAkademik.findUnique({ where: { id: tahunAkademikId }, select: { id: true } });
    if (!year) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
  }
  const rows = await tx.tagihanUKT.findMany({
    where: { mahasiswaId: student.id, ...(tahunAkademikId === undefined ? {} : { tahunAkademikId }) },
    orderBy: [{ jatuhTempo: "desc" }, { id: "asc" }],
    select: {
      id: true, nomorTagihan: true, nominal: true, jatuhTempo: true,
      tahunAkademik: { select: { id: true, tahun: true, semester: true } },
      pembayaran: {
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: { id: true, nomorPembayaran: true, nominal: true, metode: true, status: true, paidAt: true },
      },
    },
  });
  let totalBills = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let totalOutstanding = new Prisma.Decimal(0);
  const bills = rows.map(bill => {
    const { paid, remaining, status } = tuitionBalance(bill.nominal, bill.pembayaran.filter(payment => payment.status === "SUCCESS"), bill.jatuhTempo, now);
    totalBills = totalBills.plus(bill.nominal);
    totalPaid = totalPaid.plus(paid);
    totalOutstanding = totalOutstanding.plus(remaining);
    return {
      id: bill.id,
      academicYear: { id: bill.tahunAkademik.id, year: bill.tahunAkademik.tahun, semester: bill.tahunAkademik.semester },
      billNumber: bill.nomorTagihan, amount: Number(bill.nominal), paidAmount: Number(paid), remainingAmount: Number(remaining),
      dueDate: dateFormat.format(bill.jatuhTempo), status,
      payments: bill.pembayaran.map(payment => ({
        id: payment.id, paymentNumber: payment.nomorPembayaran, amount: Number(payment.nominal),
        method: payment.metode, status: payment.status, paidAt: payment.paidAt?.toISOString() ?? null,
      })),
    };
  });
  return { summary: { totalBills: Number(totalBills), totalPaid: Number(totalPaid), totalOutstanding: Number(totalOutstanding) }, bills };
}

export async function listStudentTuitionBills(tx: Prisma.TransactionClient, userId: string, now: Date) {
  const student = await tx.mahasiswa.findUnique({ where: { userId }, select: { id: true } });
  if (!student) throw { name: "NotFound", message: "Mahasiswa tidak ditemukan." };
  const bills = await tx.tagihanUKT.findMany({
    where: { mahasiswaId: student.id },
    orderBy: [{ jatuhTempo: "desc" }, { id: "asc" }],
    select: {
      id: true, nomorTagihan: true, nominal: true, jatuhTempo: true,
      tahunAkademik: { select: { id: true, tahun: true, semester: true } },
      pembayaran: { where: { status: "SUCCESS" }, select: { nominal: true, paidAt: true } },
    },
  });
  return { bills: bills.map((bill) => {
    const { paid, remaining, status } = tuitionBalance(bill.nominal, bill.pembayaran, bill.jatuhTempo, now);
    // Latest successful payment timestamp; null when no payment date is recorded.
    const paidAt = bill.pembayaran.reduce<Date | null>((latest, payment) =>
      payment.paidAt && (!latest || payment.paidAt > latest) ? payment.paidAt : latest, null);
    return {
      id: bill.id,
      academicYear: { id: bill.tahunAkademik.id, year: bill.tahunAkademik.tahun, semester: bill.tahunAkademik.semester },
      billNumber: bill.nomorTagihan, amount: Number(bill.nominal), paidAmount: Number(paid), remainingAmount: Number(remaining),
      dueDate: dateFormat.format(bill.jatuhTempo), status, paidAt: paidAt?.toISOString() ?? null,
    };
  }) };
}

type BillRow = {
  prodiId: number; studyProgramName: string;
  id: string; nomorTagihan: string; mahasiswaId: string; userId: string; nim: string; name: string;
  tahunAkademikId: number; tahun: string; semester: string; nominal: Prisma.Decimal;
  paidAmount: Prisma.Decimal; remainingAmount: Prisma.Decimal; jatuhTempo: Date; effectiveStatus: string;
};
type SummaryRow = { totalBills: bigint; paid: bigint; unpaid: bigint; overdue: bigint; totalAmount: Prisma.Decimal; paidAmount: Prisma.Decimal; outstandingAmount: Prisma.Decimal };

export async function listTuitionBills(tx: Prisma.TransactionClient, filters: ReturnType<typeof billListQuery>, now: Date) {
  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (filters.tahunAkademikId !== undefined) conditions.push(Prisma.sql`b."tahunAkademikId" = ${filters.tahunAkademikId}`);
  if (filters.prodiId !== undefined) conditions.push(Prisma.sql`m."prodiId" = ${filters.prodiId}`);
  if (filters.search) {
    // Treat %, _ and backslash as literal characters, not search wildcards.
    const pattern = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(Prisma.sql`(u."name" ILIKE ${pattern} OR m."nim" ILIKE ${pattern} OR b."nomorTagihan" ILIKE ${pattern})`);
  }
  const base = Prisma.sql`WITH balances AS (
    SELECT b.*, m."userId", m."nim", u."name", y."tahun", y."semester", m."prodiId", sp."name" AS "studyProgramName",
      COALESCE(p.amount, 0) AS "paidAmount",
      GREATEST(b."nominal" - COALESCE(p.amount, 0), 0) AS "remainingAmount"
    FROM "TagihanUKT" b
    JOIN "Mahasiswa" m ON m.id = b."mahasiswaId"
    JOIN "User" u ON u.id = m."userId"
    JOIN "Prodi" sp ON sp.id = m."prodiId"
    JOIN "TahunAkademik" y ON y.id = b."tahunAkademikId"
    LEFT JOIN LATERAL (
      SELECT SUM(p."nominal") AS amount FROM "PembayaranUKT" p
      WHERE p."tagihanId" = b.id AND p.status = 'SUCCESS'
    ) p ON TRUE
    WHERE ${Prisma.join(conditions, " AND ")}
  ), bills AS (
    SELECT balances.*, CASE
      WHEN "remainingAmount" = 0 THEN 'LUNAS'
      WHEN "jatuhTempo" < ${now} THEN 'JATUH_TEMPO'
      WHEN "paidAmount" > 0 THEN 'SEBAGIAN'
      ELSE 'BELUM_DIBAYAR' END AS "effectiveStatus"
    FROM balances
  )`;
  const statusWhere = filters.status === undefined ? Prisma.sql`TRUE` : Prisma.sql`"effectiveStatus" = ${filters.status}`;
  const [summary] = await tx.$queryRaw<SummaryRow[]>(Prisma.sql`${base}
    SELECT COUNT(*) AS "totalBills",
      COUNT(*) FILTER (WHERE "effectiveStatus" = 'LUNAS') AS paid,
      COUNT(*) FILTER (WHERE "effectiveStatus" IN ('BELUM_DIBAYAR', 'SEBAGIAN')) AS unpaid,
      COUNT(*) FILTER (WHERE "effectiveStatus" = 'JATUH_TEMPO') AS overdue,
      COALESCE(SUM(nominal), 0) AS "totalAmount",
      COALESCE(SUM("paidAmount"), 0) AS "paidAmount",
      COALESCE(SUM("remainingAmount"), 0) AS "outstandingAmount" FROM bills`);
  const [count] = await tx.$queryRaw<{ total: bigint }[]>(Prisma.sql`${base} SELECT COUNT(*) AS total FROM bills WHERE ${statusWhere}`);
  const rows = await tx.$queryRaw<BillRow[]>(Prisma.sql`${base} SELECT * FROM bills WHERE ${statusWhere}
    ORDER BY "jatuhTempo" ASC, "nomorTagihan" ASC, id ASC LIMIT ${filters.limit} OFFSET ${(filters.page - 1) * filters.limit}`);
  return {
    summary: {
      totalBills: Number(summary.totalBills), paid: Number(summary.paid), unpaid: Number(summary.unpaid), overdue: Number(summary.overdue),
      totalAmount: Number(summary.totalAmount), paidAmount: Number(summary.paidAmount), outstandingAmount: Number(summary.outstandingAmount),
    },
    bills: rows.map((row) => ({
      id: row.id, billNumber: row.nomorTagihan,
      student: { id: row.userId, studentId: row.mahasiswaId, nim: row.nim, name: row.name, prodi: { id: row.prodiId, name: row.studyProgramName } },
      academicYear: { id: row.tahunAkademikId, year: row.tahun, semester: row.semester },
      amount: Number(row.nominal), paidAmount: Number(row.paidAmount), remainingAmount: Number(row.remainingAmount),
      dueDate: dateFormat.format(row.jatuhTempo), status: row.effectiveStatus,
    })),
    pagination: { page: filters.page, limit: filters.limit, totalRows: Number(count.total), totalPages: Math.ceil(Number(count.total) / filters.limit) },
  };
}
