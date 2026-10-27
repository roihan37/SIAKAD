import { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";

export class StudentScheduleService {
    static async getMySchedule(userId: string, tahunAkademikId?: number) {
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
                                        orderBy: [{ hariUrutan: "asc" }, { jamMulai: "asc" }, { id: "asc" }],
                                        select: {
                                            id: true,
                                            hari: true,
                                            hariUrutan: true,
                                            jamMulai: true,
                                            jamSelesai: true,
                                            ruangan: { select: { id: true, kode: true, nama: true, gedung: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const schedules = (krs?.details ?? []).flatMap(({ kelasMataKuliah }) =>
                kelasMataKuliah.jadwal.map((schedule) => ({
                    id: schedule.id,
                    kelasMataKuliahId: kelasMataKuliah.id,
                    day: schedule.hari,
                    dayOrder: schedule.hariUrutan,
                    startTime: schedule.jamMulai,
                    endTime: schedule.jamSelesai,
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
                    room: {
                        id: schedule.ruangan.id,
                        code: schedule.ruangan.kode,
                        name: schedule.ruangan.nama,
                        building: schedule.ruangan.gedung,
                    },
                })),
            );

            return {
                academicYear: {
                    id: academicYear.id,
                    year: academicYear.tahun,
                    semester: academicYear.semester,
                    isActive: academicYear.isActive,
                },
                krsStatus: krs?.status ?? null,
                schedules,
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    }
}
