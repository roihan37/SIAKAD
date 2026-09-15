import { paymentFilters, paymentId, verifyPaymentBody, cancelPaymentBody } from "../validation/payments";
import { listPayments, paymentDetail, changePaymentStatus } from "../services/payments.service";
import { S3Service } from "../services/s3.service";
import { gradeFilters, gradeId, gradeUserId } from "../validation/grades";
import { gradeSummary, studentGradeRecap, courseGradeRecap, courseGradeDetail, studentGradeDetail } from "../services/grades.service";
import { listTuitionBills } from "../services/tuition.service";
import { billGenerationBody, billListQuery } from "../validation/tuition";
import { tuitionBillNumber } from "../services/tuition-number";
import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { resourceId } from "../validation/master-data";
import { countScheduleConflicts, jakartaWeekday } from "../services/dashboard.service";

export class Controller {
  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = paymentFilters(req.query);
      const data = await prisma.$transaction(tx => listPayments(tx, filters), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Payments retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = paymentId(req.params.paymentId);
      const result = await prisma.$transaction(tx => paymentDetail(tx, id), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      const proofUrl = result.proofKey ? await S3Service.createReadUrl(result.proofKey) : null;
      return res.status(200).json({ message: "Payment detail retrieved successfully", data: { ...result.data, proofUrl } });
    } catch (error) { next(error); }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userLogin) throw { name: "TokenInvalid" };
      if (req.userLogin.role !== "Admin") throw { name: "Forbidden", message: "Only administrators can verify payments." };
      const actorId = req.userLogin.id;
      const id = paymentId(req.params.paymentId);
      const { decision, reason } = verifyPaymentBody(req.body);
      const data = await prisma.$transaction(tx => changePaymentStatus(tx, id, actorId, decision, reason), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return res.status(200).json({ message: "Payment verified successfully", data });
    } catch (error) { next(error); }
  }

  static async cancelPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userLogin) throw { name: "TokenInvalid" };
      if (req.userLogin.role !== "Admin") throw { name: "Forbidden", message: "Only administrators can cancel payments." };
      const actorId = req.userLogin.id;
      const id = paymentId(req.params.paymentId);
      const { reason } = cancelPaymentBody(req.body);
      const data = await prisma.$transaction(tx => changePaymentStatus(tx, id, actorId, "CANCEL", reason), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return res.status(200).json({ message: "Payment cancelled successfully", data });
    } catch (error) { next(error); }
  }

  static async getGradeSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = gradeFilters(req.query);
      const data = await prisma.$transaction(tx => gradeSummary(tx, filters), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Grade summary retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getStudentGradeRecap(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = gradeFilters(req.query);
      const data = await prisma.$transaction(tx => studentGradeRecap(tx, filters), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Student grade recap retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getCourseGradeRecap(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = gradeFilters(req.query);
      const data = await prisma.$transaction(tx => courseGradeRecap(tx, filters), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Course grade recap retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getCourseGradeDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = gradeFilters(req.query);
      const assignmentId = gradeId(req.params.kelasMataKuliahId, "kelasMataKuliahId");
      const data = await prisma.$transaction(tx => courseGradeDetail(tx, filters, assignmentId), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Course grade detail retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getStudentGradeDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = gradeUserId(req.params.studentId);
      const assignmentId = gradeId(req.params.kelasMataKuliahId, "kelasMataKuliahId");
      const data = await prisma.$transaction(tx => studentGradeDetail(tx, userId, assignmentId), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Student grade detail retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async getUKTBills(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = billListQuery(req.query);
      const now = new Date();
      const data = await prisma.$transaction((tx) => listTuitionBills(tx, filters, now), {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      });
      return res.status(200).json({ message: "Tuition bills retrieved successfully", data });
    } catch (error) { next(error); }
  }

  static async generateBillsUKT(req: Request, res: Response, next: NextFunction) {
    try {
      const { tahunAkademikId, prodiId, angkatan, nominal, jatuhTempo } = billGenerationBody(req.body);
      const data = await prisma.$transaction(async (tx) => {
        const year = await tx.tahunAkademik.findUnique({ where: { id: tahunAkademikId }, select: { id: true, tahun: true, semester: true } });
        if (!year) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
        const prodi = await tx.prodi.findUnique({ where: { id: prodiId }, select: { id: true } });
        if (!prodi) throw { name: "NotFound", message: "Program studi tidak ditemukan." };
        const students = await tx.mahasiswa.findMany({
          where: { prodiId, angkatan, status: "Aktif" }, select: { id: true, nim: true }, orderBy: { nim: "asc" },
        });
        let generated = 0;
        for (let index = 0; index < students.length; index += 1000) {
          const result = await tx.tagihanUKT.createMany({
            data: students.slice(index, index + 1000).map((student) => ({
              mahasiswaId: student.id, tahunAkademikId,
              nomorTagihan: tuitionBillNumber(year.tahun, year.semester, student.nim),
              nominal, jatuhTempo, status: "BELUM_DIBAYAR",
            })),
            // Unique mahasiswaId/tahunAkademikId juga melindungi request bersamaan.
            skipDuplicates: true,
          });
          generated += result.count;
        }
        return { generated, skipped: students.length - generated };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 30000 });
      return res.status(200).json({ message: "Tuition bills generated successfully", data });
    } catch (error) { next(error); }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const yearId = req.query.tahunAkademikId === undefined ? undefined : resourceId(req.query.tahunAkademikId);
      const today = jakartaWeekday();
      const data = await prisma.$transaction(async (tx) => {
        const year = yearId === undefined
          ? await tx.tahunAkademik.findFirst({ where: { isActive: true }, orderBy: [{ tahun: "desc" }, { id: "desc" }], select: { id: true, tahun: true, semester: true } })
          : await tx.tahunAkademik.findUnique({ where: { id: yearId }, select: { id: true, tahun: true, semester: true } });
        if (!year) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };

        const [students, activeStudents, lecturers, activeLecturers, programs, faculties, classes, unassigned, krsGroups, schedules] = await Promise.all([
          tx.mahasiswa.count(),
          tx.mahasiswa.count({ where: { status: "Aktif" } }),
          tx.dosen.count(),
          tx.dosen.count({ where: { status: "Aktif" } }),
          tx.prodi.count(),
          tx.fakultas.count(),
          tx.kelas.count({ where: { tahunAkademikId: year.id } }),
          tx.kelas.count({ where: { tahunAkademikId: year.id, kelasMK: { none: {} } } }),
          tx.kRS.groupBy({ by: ["status"], where: { tahunAkademikId: year.id, mahasiswa: { status: "Aktif" } }, _count: { _all: true } }),
          tx.jadwal.findMany({
            where: { tahunAkademikId: year.id },
            orderBy: [{ jamMulai: "asc" }, { id: "asc" }],
            select: {
              id: true, hari: true, jamMulai: true, jamSelesai: true, ruanganId: true,
              ruangan: { select: { id: true, nama: true } },
              kelasMataKuliah: { select: {
                kelasId: true, dosenId: true,
                kelas: { select: { id: true, nama: true } },
                mataKuliah: { select: { id: true, kode: true, nama: true } },
                dosen: { select: { user: { select: { id: true, name: true } } } },
              } },
            },
          }),
        ]);
        // Submitted termasuk pengajuan yang menunggu, disetujui, atau ditolak; draft belum diajukan.
        const submitted = krsGroups.filter((group) => group.status !== "DRAFT").reduce((sum, group) => sum + group._count._all, 0);
        const pendingApproval = krsGroups.find((group) => group.status === "DIAJUKAN")?._count._all ?? 0;
        const notSubmitted = activeStudents - submitted;
        return {
          academicYear: { id: year.id, year: year.tahun, semester: year.semester },
          summary: {
            students: { total: students, active: activeStudents },
            lecturers: { total: lecturers, active: activeLecturers },
            studyPrograms: { total: programs, faculties },
            activeClasses: classes,
          },
          krs: { percentage: activeStudents ? Math.round(submitted / activeStudents * 100) : 0, submitted, notSubmitted, pendingApproval,
            categories: { BELUM_KRS: activeStudents - krsGroups.reduce((sum, group) => sum + group._count._all, 0),
              ...Object.fromEntries(["DRAFT", "DIAJUKAN", "DISETUJUI", "DITOLAK"].map((status) => [status, krsGroups.find((group) => group.status === status)?._count._all ?? 0])) } },
          attention: { studentsWithoutKrs: notSubmitted, overdueTuition: null, classesWithoutLecturer: unassigned, scheduleConflicts: countScheduleConflicts(schedules) },
          todaySchedules: schedules.filter((schedule) => schedule.hari === today).map((schedule) => ({
            id: schedule.id, startTime: schedule.jamMulai, endTime: schedule.jamSelesai,
            course: { id: schedule.kelasMataKuliah.mataKuliah.id, code: schedule.kelasMataKuliah.mataKuliah.kode, name: schedule.kelasMataKuliah.mataKuliah.nama },
            class: { id: schedule.kelasMataKuliah.kelas.id, name: schedule.kelasMataKuliah.kelas.nama },
            lecturer: schedule.kelasMataKuliah.dosen.user,
            room: { id: schedule.ruangan.id, name: schedule.ruangan.nama },
          })),
          // Belum ada model tagihan/pembayaran dan audit aktivitas pada schema.
          tuition: { percentage: null, paidAmount: null, unpaidAmount: null },
          recentActivities: [],
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      return res.status(200).json({ message: "Dashboard retrieved successfully", data });
    } catch (error) { next(error); }
  }
}
