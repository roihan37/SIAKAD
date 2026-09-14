import { Prisma } from '@prisma/client';
import { GradeFilters } from '../validation/grades';

const courseInclude = { mataKuliah: true, kelas: true, dosen: { include: { user: { select: { id: true, name: true } } } } } satisfies Prisma.KelasMataKuliahInclude;
const recordInclude = {
  nilai: true,
  krs: { include: { mahasiswa: { include: { user: { select: { id: true, name: true } }, prodi: true } } } },
  kelasMataKuliah: { include: courseInclude },
} satisfies Prisma.KRSDetailInclude;
type RecordRow = Prisma.KRSDetailGetPayload<{ include: typeof recordInclude }>;
const numeric = (value: Prisma.Decimal | null) => value === null ? null : Number(value);
const pagination = (totalRows: number, filters: GradeFilters) => ({ page: filters.page, limit: filters.limit, totalRows, totalPages: Math.ceil(totalRows / filters.limit) });

export function assignmentWhere(f: GradeFilters): Prisma.KelasMataKuliahWhereInput {
  return { kelas: { tahunAkademikId: f.academicYearId, prodiId: f.studyProgramId }, kelasId: f.classId, mataKuliahId: f.courseId, dosenId: f.lecturerId };
}
export function gradeWhere(f: GradeFilters, includeStatus = true): Prisma.KRSDetailWhereInput {
  return {
    krs: { tahunAkademikId: f.academicYearId, mahasiswa: {
      prodiId: f.studyProgramId,
      ...(f.search ? { OR: [{ nim: { contains: f.search, mode: 'insensitive' as const } }, { user: { name: { contains: f.search, mode: 'insensitive' as const } } }] } : {}),
    } },
    kelasMataKuliah: assignmentWhere(f),
    ...(includeStatus && f.status ? { nilai: f.status === 'BELUM_DIINPUT' ? { is: null } : { is: { status: f.status } } } : {}),
  };
}
export async function requireGradeYear(tx: Prisma.TransactionClient, id: number) {
  const year = await tx.tahunAkademik.findUnique({ where: { id }, select: { id: true, tahun: true, semester: true } });
  if (!year) throw { name: 'NotFound', message: 'Academic year not found.' };
  return year;
}
export function gradeStats(rows: { nilai: { status: string; nilaiAkhir: Prisma.Decimal | null } | null }[]) {
  const scores = rows.flatMap(row => row.nilai?.nilaiAkhir == null ? [] : [row.nilai.nilaiAkhir]);
  const average = scores.length ? Number(scores.reduce((sum, score) => sum.plus(score), new Prisma.Decimal(0)).div(scores.length).toFixed(2)) : null;
  const gradedCount = rows.filter(row => row.nilai?.status === 'FINAL').length;
  return { studentCount: rows.length, gradedCount, averageFinalScore: average };
}
function studentRow(row: RecordRow) {
  const student = row.krs.mahasiswa;
  return { id: student.userId, studentId: student.id, nim: student.nim, name: student.user.name };
}
function scoreRow(row: RecordRow) {
  return { finalScore: row.nilai ? numeric(row.nilai.nilaiAkhir) : null, grade: row.nilai?.grade ?? null, status: row.nilai?.status ?? 'BELUM_DIINPUT' };
}
export async function gradeSummary(tx: Prisma.TransactionClient, f: GradeFilters) {
  await requireGradeYear(tx, f.academicYearId);
  const rows = await tx.kRSDetail.findMany({ where: gradeWhere(f), select: { krs: { select: { mahasiswaId: true } }, nilai: { select: { status: true, nilaiAkhir: true } } } });
  const stats = gradeStats(rows);
  return { totalStudents: new Set(rows.map(row => row.krs.mahasiswaId)).size, totalGradeRecords: rows.length, completedGrades: stats.gradedCount, incompleteGrades: rows.length - stats.gradedCount, averageFinalScore: stats.averageFinalScore };
}
export async function studentGradeRecap(tx: Prisma.TransactionClient, f: GradeFilters) {
  await requireGradeYear(tx, f.academicYearId);
  const where = gradeWhere(f);
  const direction = f.sortOrder;
  const orders: Record<GradeFilters['sortBy'], Prisma.KRSDetailOrderByWithRelationInput> = {
    nim: { krs: { mahasiswa: { nim: direction } } }, name: { krs: { mahasiswa: { user: { name: direction } } } },
    finalScore: { nilai: { nilaiAkhir: { sort: direction, nulls: 'last' } } }, grade: { nilai: { grade: { sort: direction, nulls: 'last' } } }, status: { nilai: { status: direction } },
  };
  const [totalRows, rows] = await Promise.all([
    tx.kRSDetail.count({ where }),
    tx.kRSDetail.findMany({ where, include: recordInclude, orderBy: [orders[f.sortBy], { id: 'asc' }], skip: (f.page - 1) * f.limit, take: f.limit }),
  ]);
  return { grades: rows.map(row => ({ krsDetailId: row.id, student: { ...studentRow(row), studyProgram: { id: row.krs.mahasiswa.prodi.id, name: row.krs.mahasiswa.prodi.name } }, class: { id: row.kelasMataKuliah.kelas.id, name: row.kelasMataKuliah.kelas.nama }, course: { id: row.kelasMataKuliah.mataKuliah.id, code: row.kelasMataKuliah.mataKuliah.kode, name: row.kelasMataKuliah.mataKuliah.nama }, ...scoreRow(row) })), pagination: pagination(totalRows, f) };
}
export async function courseGradeRecap(tx: Prisma.TransactionClient, f: GradeFilters) {
  await requireGradeYear(tx, f.academicYearId);
  // Aggregate complete participant groups before filtering their derived status.
  const rows = await tx.kelasMataKuliah.findMany({ where: assignmentWhere(f), include: { ...courseInclude, krsDetails: { where: gradeWhere(f, false), select: { nilai: { select: { status: true, nilaiAkhir: true } } } } }, orderBy: { id: 'asc' } });
  const courses = rows.map(row => {
    const stats = gradeStats(row.krsDetails);
    const status = stats.gradedCount === 0 ? 'BELUM_DIINPUT' : stats.gradedCount < stats.studentCount ? 'BELUM_LENGKAP' : 'FINAL';
    return { kelasMataKuliahId: row.id, course: { id: row.mataKuliah.id, code: row.mataKuliah.kode, name: row.mataKuliah.nama }, class: { id: row.kelas.id, name: row.kelas.nama }, lecturer: { id: row.dosen.userId, lecturerId: row.dosen.id, name: row.dosen.user.name }, ...stats, status };
  }).filter(row => !f.status || row.status === f.status);
  return { courses: courses.slice((f.page - 1) * f.limit, f.page * f.limit), pagination: pagination(courses.length, f) };
}
export async function courseGradeDetail(tx: Prisma.TransactionClient, f: GradeFilters, assignmentId: number) {
  const year = await requireGradeYear(tx, f.academicYearId);
  const assignment = await tx.kelasMataKuliah.findFirst({ where: { id: assignmentId, kelas: { tahunAkademikId: f.academicYearId } }, include: courseInclude });
  if (!assignment) throw { name: 'NotFound', message: 'Course class not found in the selected academic year.' };
  const rows = await tx.kRSDetail.findMany({ where: { kelasMataKuliahId: assignmentId, krs: { tahunAkademikId: f.academicYearId } }, include: recordInclude, orderBy: [{ krs: { mahasiswa: { nim: 'asc' } } }, { id: 'asc' }] });
  return { course: { kelasMataKuliahId: assignment.id, code: assignment.mataKuliah.kode, name: assignment.mataKuliah.nama, class: assignment.kelas.nama, lecturer: assignment.dosen.user.name, academicYear: { id: year.id, year: year.tahun, semester: year.semester } }, summary: gradeStats(rows), students: rows.map(row => ({ ...studentRow(row), ...scoreRow(row) })) };
}
export async function studentGradeDetail(tx: Prisma.TransactionClient, userId: string, assignmentId: number) {
  const assignment = await tx.kelasMataKuliah.findUnique({ where: { id: assignmentId }, select: { kelas: { select: { tahunAkademikId: true } } } });
  if (!assignment) throw { name: 'NotFound', message: 'Course class not found.' };
  const row = await tx.kRSDetail.findFirst({ where: { kelasMataKuliahId: assignmentId, krs: { mahasiswa: { userId }, tahunAkademikId: assignment.kelas.tahunAkademikId } }, include: { ...recordInclude, nilai: { include: { koreksi: { orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] } } } } });
  if (!row) throw { name: 'NotFound', message: 'Student course enrollment not found.' };
  const course = row.kelasMataKuliah;
  return { student: { ...studentRow(row), class: { id: course.kelas.id, name: course.kelas.nama }, studyProgram: { id: row.krs.mahasiswa.prodi.id, name: row.krs.mahasiswa.prodi.name } }, course: { kelasMataKuliahId: course.id, id: course.mataKuliah.id, code: course.mataKuliah.kode, name: course.mataKuliah.nama, lecturer: { id: course.dosen.userId, name: course.dosen.user.name } }, components: { assignment: row.nilai ? numeric(row.nilai.tugas) : null, midterm: row.nilai ? numeric(row.nilai.uts) : null, finalExam: row.nilai ? numeric(row.nilai.uas) : null }, ...scoreRow(row), corrections: row.nilai?.koreksi.map(correction => ({ id: correction.id, changedById: correction.changedById, previousFinalScore: numeric(correction.nilaiAkhirLama), newFinalScore: numeric(correction.nilaiAkhirBaru), reason: correction.alasan, createdAt: correction.createdAt.toISOString() })) ?? [] };
}
