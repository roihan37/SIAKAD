import { Prisma, StatusKehadiran } from "@prisma/client";
import { integer, text } from "../validation/master-data";

export function attendanceFilters(query: Record<string, unknown>) {
  const id = (key: string) => query[key] === undefined ? undefined : integer(key)(query[key]);
  const search = query.search === undefined || query.search === "" ? "" : text("search", 200)(query.search);
  const page = query.page === undefined ? 1 : integer("page", 1, 1000000)(query.page);
  const limit = query.limit === undefined ? 10 : integer("limit", 1, 100)(query.limit);
  const dosenId = query.dosenId === undefined ? undefined : text("dosenId", 100)(query.dosenId);
  const structural: Prisma.JadwalWhereInput = {
    tahunAkademikId: id("tahunAkademikId"),
    kelasMataKuliah: { kelasId: id("kelasId"), mataKuliahId: id("mataKuliahId"), dosenId, kelas: { prodiId: id("prodiId") } },
  };
  const contains = { contains: search, mode: Prisma.QueryMode.insensitive };
  const where: Prisma.PertemuanWhereInput = {
    jadwal: structural,
    ...(search ? { OR: [
      { topik: contains },
      { jadwal: { kelasMataKuliah: { mataKuliah: { OR: [{ kode: contains }, { nama: contains }] } } } },
      { jadwal: { kelasMataKuliah: { kelas: { nama: contains } } } },
      { jadwal: { kelasMataKuliah: { dosen: { user: { name: contains } } } } },
      { absensi: { some: { mahasiswa: { OR: [{ nim: contains }, { user: { name: contains } }] } } } },
    ] } : {}),
  };
  return { page, limit, where, structural };
}
export const percentage = (present: number, total: number) => total ? Math.round(present / total * 1000) / 10 : 0;
export function attendanceCounts(records: { status: StatusKehadiran }[]) {
  const counts = { present: 0, permission: 0, sick: 0, absent: 0, total: records.length };
  for (const record of records) {
    if (record.status === "HADIR") counts.present++;
    else if (record.status === "IZIN") counts.permission++;
    else if (record.status === "SAKIT") counts.sick++;
    else if (record.status === "ALPHA") counts.absent++;
  }
  return counts;
}
export const meetingSelect = {
  id: true, pertemuan: true, tanggal: true, topik: true,
  jadwal: { select: { kelasMataKuliah: { select: {
    mataKuliah: { select: { id: true, kode: true, nama: true } },
    kelas: { select: { id: true, nama: true } },
    dosen: { select: { user: { select: { id: true, name: true } } } },
  } } } },
} satisfies Prisma.PertemuanSelect;
export function meetingResponse(row: Prisma.PertemuanGetPayload<{ select: typeof meetingSelect }>) {
  const assignment = row.jadwal.kelasMataKuliah;
  // Kalender lokal kampus; jangan menggeser tanggal karena pemotongan ISO UTC.
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(row.tanggal);
  return { id: row.id, meetingNumber: row.pertemuan, date,
    course: { id: assignment.mataKuliah.id, code: assignment.mataKuliah.kode, name: assignment.mataKuliah.nama },
    class: { id: assignment.kelas.id, name: assignment.kelas.nama }, lecturer: assignment.dosen.user };
}
export function pagination(totalRows: number, page: number, limit: number) { return { page, limit, totalRows, totalPages: Math.ceil(totalRows / limit) }; }
