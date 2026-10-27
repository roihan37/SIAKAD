import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { attendanceCounts, percentage } from "../attendance.service";
import { AppError } from "../../errors/app-error";

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
    static async getMyAttendance(userId: string, tahunAkademikId?: number) {
        return prisma.$transaction(async (tx) => {
            const student = await tx.mahasiswa.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!student) {
                throw new AppError(404, "STUDENT_NOT_FOUND", "Data mahasiswa tidak ditemukan.");
            }

            const academicYear = tahunAkademikId === undefined
                ? await tx.tahunAkademik.findFirst({
                    where: { isActive: true },
                    orderBy: { id: "desc" },
                    select: { id: true, tahun: true, semester: true, isActive: true },
                })
                : await tx.tahunAkademik.findUnique({
                    where: { id: tahunAkademikId },
                    select: { id: true, tahun: true, semester: true, isActive: true },
                });

            if (!academicYear) {
                throw new AppError(404, "ACADEMIC_YEAR_NOT_FOUND", "Tahun akademik tidak ditemukan.");
            }

            const krs = await tx.kRS.findUnique({
                where: {
                    mahasiswaId_tahunAkademikId: {
                        mahasiswaId: student.id,
                        tahunAkademikId: academicYear.id,
                    },
                },
                select: {
                    status: true,
                    details: {
                        where: { status: "DISETUJUI" },
                        select: {
                            kelasMataKuliah: {
                                select: {
                                    id: true,
                                    mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
                                    kelas: { select: { id: true, nama: true } },
                                    dosen: { select: { user: { select: { id: true, name: true } } } },
                                    jadwal: {
                                        where: { tahunAkademikId: academicYear.id },
                                        select: {
                                            pertemuan: {
                                                where: { absensi: { some: { mahasiswaId: student.id } } },
                                                orderBy: [{ tanggal: "asc" }, { pertemuan: "asc" }],
                                                select: {
                                                    id: true,
                                                    pertemuan: true,
                                                    tanggal: true,
                                                    topik: true,
                                                    absensi: {
                                                        where: { mahasiswaId: student.id },
                                                        select: { id: true, status: true, keterangan: true },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const courses = (krs?.details ?? []).map(({ kelasMataKuliah }) => {
                const records = kelasMataKuliah.jadwal.flatMap(({ pertemuan }) =>
                    pertemuan.flatMap((meeting) => meeting.absensi.map((attendance) => ({
                        id: attendance.id,
                        meetingId: meeting.id,
                        meetingNumber: meeting.pertemuan,
                        date: meeting.tanggal,
                        topic: meeting.topik,
                        status: attendance.status,
                        note: attendance.keterangan,
                    }))),
                ).sort((a, b) => a.date.getTime() - b.date.getTime() || a.meetingNumber - b.meetingNumber);
                const counts = attendanceCounts(records);

                return {
                    kelasMataKuliahId: kelasMataKuliah.id,
                    course: {
                        id: kelasMataKuliah.mataKuliah.id,
                        code: kelasMataKuliah.mataKuliah.kode,
                        name: kelasMataKuliah.mataKuliah.nama,
                        credits: kelasMataKuliah.mataKuliah.sks,
                    },
                    class: {
                        id: kelasMataKuliah.kelas.id,
                        name: kelasMataKuliah.kelas.nama,
                    },
                    lecturer: kelasMataKuliah.dosen.user,
                    records,
                    attendance: {
                        present: counts.present,
                        permission: counts.permission,
                        sick: counts.sick,
                        absent: counts.absent,
                        totalRecords: counts.total,
                        percentage: percentage(counts.present, counts.total),
                    },
                };
            }).sort((a, b) => a.course.code.localeCompare(b.course.code) || a.kelasMataKuliahId - b.kelasMataKuliahId);

            const totals = attendanceCounts(courses.flatMap((course) => course.records));
            return {
                academicYear: {
                    id: academicYear.id,
                    year: academicYear.tahun,
                    semester: academicYear.semester,
                    isActive: academicYear.isActive,
                },
                krsStatus: krs?.status ?? null,
                summary: {
                    attendancePercentage: percentage(totals.present, totals.total),
                    present: totals.present,
                    permission: totals.permission,
                    sick: totals.sick,
                    absent: totals.absent,
                    totalRecords: totals.total,
                },
                courses,
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    }

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
