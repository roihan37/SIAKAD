import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { attendanceCounts, percentage } from "../attendance.service";

export interface StudentAttendanceResult {
    academicYear: { id: number; year: string; semester: string };
    summary: {
        attendancePercentage: number;
        present: number;
        permission: number;
        sick: number;
        absent: number;
        totalRecords: number;
    };
    courses: Array<{
        course: { id: number; code: string; name: string };
        meetings: number;
        attendance: {
            present: number;
            permission: number;
            sick: number;
            absent: number;
            percentage: number;
        };
    }>;
}

export class StudentAttendanceService {
    static async getStudentAttendance(userId: string, tahunAkademikId: number) {
        return prisma.$transaction(
            (tx) => this.getStudentAttendanceInTransaction(tx, userId, tahunAkademikId),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    /**
     * Get attendance data for a student by user ID and academic year.
     * Used by GET /api/v1/students/:id/presensi
     */
    private static async getStudentAttendanceInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        tahunAkademikId: number
    ): Promise<StudentAttendanceResult> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true } } },
        });
        
        if (!user?.mahasiswa) {
            throw { name: "NotFound", message: "Mahasiswa tidak ditemukan." };
        }
        
        const year = await prismaClient.tahunAkademik.findUnique({
            where: { id: tahunAkademikId },
            select: { id: true, tahun: true, semester: true },
        });
        
        if (!year) {
            throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
        }
        
        const records = await prismaClient.absensi.findMany({
            where: { mahasiswaId: user.mahasiswa.id, pertemuan: { jadwal: { tahunAkademikId } } },
            select: {
                status: true,
                pertemuan: { select: { jadwal: { select: { kelasMataKuliah: { select: {
                    mataKuliah: { select: { id: true, kode: true, nama: true } },
                } } } } } },
            },
        });
        
        const totals = attendanceCounts(records);
        
        const grouped = new Map<number, {
            course: { id: number; code: string; name: string };
            counts: ReturnType<typeof attendanceCounts>;
        }>();
        
        for (const record of records) {
            const course = record.pertemuan.jadwal.kelasMataKuliah.mataKuliah;
            const group = grouped.get(course.id) ?? {
                course: { id: course.id, code: course.kode, name: course.nama },
                counts: attendanceCounts([]),
            };
            const counts = attendanceCounts([record]);
            for (const key of ["present", "permission", "sick", "absent", "total"] as const) {
                group.counts[key] += counts[key];
            }
            grouped.set(course.id, group);
        }
        
        return {
            academicYear: { id: year.id, year: year.tahun, semester: year.semester },
            summary: {
                attendancePercentage: percentage(totals.present, totals.total),
                present: totals.present,
                permission: totals.permission,
                sick: totals.sick,
                absent: totals.absent,
                totalRecords: totals.total,
            },
            courses: [...grouped.values()]
                .sort((a, b) => a.course.code.localeCompare(b.course.code) || a.course.id - b.course.id)
                .map(({ course, counts }) => ({
                    course,
                    meetings: counts.total,
                    attendance: {
                        present: counts.present,
                        permission: counts.permission,
                        sick: counts.sick,
                        absent: counts.absent,
                        percentage: percentage(counts.present, counts.total),
                    },
                })),
        };
    }
}
