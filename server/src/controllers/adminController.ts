import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { resourceId } from "../validation/master-data";
import { countScheduleConflicts, jakartaWeekday } from "../services/dashboard.service";

export class Controller {
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
          krs: { percentage: activeStudents ? Math.round(submitted / activeStudents * 100) : 0, submitted, notSubmitted, pendingApproval },
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
