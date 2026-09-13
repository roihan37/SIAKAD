import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { text } from "../validation/master-data";
import { attendanceFilters, attendanceCounts, meetingSelect, meetingResponse, pagination, percentage } from "../services/attendance.service";

export class Controller {
  static async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const { where } = attendanceFilters(req.query);
      const groups = await prisma.absensi.groupBy({ by: ["status"], where: { pertemuan: where }, _count: { _all: true } });
      const count = (status: string) => groups.find((group) => group.status === status)?._count._all ?? 0;
      const total = groups.reduce((sum, group) => sum + group._count._all, 0);
      res.json({ message: "Attendance summary retrieved successfully", data: {
        averageAttendance: percentage(count("HADIR"), total), present: count("HADIR"), permission: count("IZIN"), sick: count("SAKIT"), absent: count("ALPHA"), totalAttendanceRecords: total,
      } });
    } catch (error) { next(error); }
  }
  static async students(req: Request, res: Response, next: NextFunction) {
    try {
      const { where, page, limit } = attendanceFilters(req.query);
      // Class is reached through the meeting, not a direct Mahasiswa.class relation.
      const records = await prisma.absensi.findMany({ where: { pertemuan: where }, select: {
        status: true,
        mahasiswa: { select: { id: true, nim: true, user: { select: { id: true, name: true } }, prodi: { select: { id: true, name: true } } } },
        pertemuan: { select: { jadwal: { select: { kelasMataKuliah: { select: { kelas: { select: { id: true, nama: true } } } } } } } },
      } });
      const rows = new Map<string, { id: string; studentId: string; nim: string; name: string; studyProgram: { id: number; name: string }; class: { id: number; name: string }; attendance: ReturnType<typeof attendanceCounts> }>();
      for (const record of records) {
        const student = record.mahasiswa, kelas = record.pertemuan.jadwal.kelasMataKuliah.kelas;
        const key = `${student.id}:${kelas.id}`;
        const row = rows.get(key) ?? { id: student.user.id, studentId: student.id, nim: student.nim, name: student.user.name, studyProgram: student.prodi, class: { id: kelas.id, name: kelas.nama }, attendance: attendanceCounts([]) };
        const counts = attendanceCounts([record]);
        for (const field of ["present", "permission", "sick", "absent", "total"] as const) row.attendance[field] += counts[field];
        rows.set(key, row);
      }
      const all = [...rows.values()].sort((a, b) => a.nim.localeCompare(b.nim) || a.class.id - b.class.id);
      const students = all.slice((page - 1) * limit, page * limit).map((row) => ({ ...row, attendance: { ...row.attendance, percentage: percentage(row.attendance.present, row.attendance.total) } }));
      res.json({ message: "Student attendance recap retrieved successfully", data: { students, pagination: pagination(all.length, page, limit) } });
    } catch (error) { next(error); }
  }
  static async meetings(req: Request, res: Response, next: NextFunction) {
    try {
      const { where, page, limit } = attendanceFilters(req.query);
      const data = await prisma.$transaction(async (tx) => {
        const total = await tx.pertemuan.count({ where });
        const meetings = await tx.pertemuan.findMany({ where, select: meetingSelect, orderBy: [{ tanggal: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit });
        const groups = await tx.absensi.groupBy({ by: ["pertemuanId", "status"], where: { pertemuanId: { in: meetings.map((meeting) => meeting.id) } }, _count: { _all: true } });
        return { meetings: meetings.map((meeting) => {
          const counts = attendanceCounts([]);
          for (const group of groups.filter((item) => item.pertemuanId === meeting.id)) {
            const field = { HADIR: "present", IZIN: "permission", SAKIT: "sick", ALPHA: "absent" } as const;
            counts[field[group.status]] += group._count._all; counts.total += group._count._all;
          }
          return { ...meetingResponse(meeting), attendance: counts };
        }), pagination: pagination(total, page, limit) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
      res.json({ message: "Meeting attendance recap retrieved successfully", data });
    } catch (error) { next(error); }
  }
  static async meetingDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = text("meetingId", 100)(req.params.meetingId);
      const { where } = attendanceFilters(req.query);
      const meeting = await prisma.pertemuan.findFirst({ where: { AND: [{ id }, where] }, select: {
        ...meetingSelect,
        absensi: { orderBy: { mahasiswa: { nim: "asc" } }, select: { status: true, keterangan: true, mahasiswa: { select: { id: true, nim: true, user: { select: { name: true } } } } } },
      } });
      if (!meeting) throw { name: "NotFound", message: "Pertemuan tidak ditemukan." };
      res.json({ message: "Meeting attendance detail retrieved successfully", data: {
        meeting: { ...meetingResponse(meeting), topic: meeting.topik },
        students: meeting.absensi.map((item) => ({ id: item.mahasiswa.id, nim: item.mahasiswa.nim, name: item.mahasiswa.user.name, status: item.status, note: item.keterangan })),
      } });
    } catch (error) { next(error); }
  }
  static async filters(req: Request, res: Response, next: NextFunction) {
    try {
      const { where, structural, page, limit } = attendanceFilters(req.query);
      // Options follow the same scope, including meetings matching search when supplied.
      const schedules = await prisma.jadwal.findMany({ where: { ...structural, ...(req.query.search ? { pertemuan: { some: where } } : {}) }, select: {
        tahunAkademik: { select: { id: true, tahun: true, semester: true } },
        kelasMataKuliah: { select: { kelas: { select: { id: true, nama: true, prodi: { select: { id: true, name: true } } } }, mataKuliah: { select: { id: true, kode: true, nama: true } }, dosen: { select: { id: true, user: { select: { id: true, name: true } } } } } },
      } });
      const options = <T extends { id: string | number }>(items: T[]) => {
        const unique = [...new Map(items.map((item) => [item.id, item])).values()].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
        return { items: unique.slice((page - 1) * limit, page * limit), pagination: pagination(unique.length, page, limit) };
      };
      res.json({ message: "Attendance filters retrieved successfully", data: {
        academicYears: options(schedules.map((s) => ({ id: s.tahunAkademik.id, year: s.tahunAkademik.tahun, semester: s.tahunAkademik.semester }))),
        studyPrograms: options(schedules.map((s) => s.kelasMataKuliah.kelas.prodi)),
        classes: options(schedules.map((s) => ({ id: s.kelasMataKuliah.kelas.id, name: s.kelasMataKuliah.kelas.nama }))),
        courses: options(schedules.map((s) => ({ id: s.kelasMataKuliah.mataKuliah.id, code: s.kelasMataKuliah.mataKuliah.kode, name: s.kelasMataKuliah.mataKuliah.nama }))),
        lecturers: options(schedules.map((s) => ({ id: s.kelasMataKuliah.dosen.id, userId: s.kelasMataKuliah.dosen.user.id, name: s.kelasMataKuliah.dosen.user.name }))),
      } });
    } catch (error) { next(error); }
  }
}
