import { prisma } from "../../lib/prisma";
import { Prisma, Semester } from "@prisma/client";

export interface SemesterRecord {
    semester: number;
    tahunAkademik: {
        id: number;
        tahun: string;
        semester: Semester;
        label: string;
    };
    sks: number;
    ips: number;
    ipk: number;
    status: string;
}

export interface KRSData {
    id: string;
    tahunAkademik: {
        id: number;
        tahun: string;
        semester: Semester;
        label: string;
    };
    status: string;
    totalSKS: number;
    details: Array<{
        id: string;
        mataKuliah: {
            id: number;
            kode: string;
            nama: string;
            sks: number;
        };
        kelas: {
            id: number;
            nama: string;
        };
        status: string;
    }>;
}

export interface NilaiData {
    tahunAkademik: {
        id: number;
        tahun: string;
        semester: Semester;
        label: string;
    };
    details: Array<{
        id: string;
        mataKuliah: {
            id: number;
            kode: string;
            nama: string;
            sks: number;
        };
        nilai: number | null;
        grade: string | null;
        bobot: number;
    }>;
    summary: {
        totalSKS: number;
        ips: number;
        ipk: number;
    };
}

export interface NilaiResult {
    nilai: NilaiData | null;
    reason: string | null;
}

export interface StudentTranscriptResult {
    cumulativeGpa: number;
    completedCredits: number;
    semesters: Array<{
        id: number;
        semesterNumber: number;
        academicYear: { id: number; tahun: string; semester: Semester; label: string };
        semesterGpa: number;
        totalCredits: number;
        courses: NilaiData["details"];
    }>;
}

type KRSDetailWithGrade = {
    id: string;
    transkrip: Array<{ bobot?: number | null; nilaiAngka?: number | null; nilaiHuruf?: string | null }>;
    kelasMataKuliah: {
        mataKuliah: { id: number; kode: string; nama: string; sks: number };
    };
};

type KRSRecordForNilai = {
    tahunAkademikId: number;
    tahunAkademik: { tahun: string; semester: string };
    details: KRSDetailWithGrade[];
};

export class StudentAcademicService {
    static async getStudentNilai(userId: string, tahunAkademikId: number) {
        return prisma.$transaction(
            (tx) => this.getStudentNilaiInTransaction(tx, userId, tahunAkademikId),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    static async getMyTranscript(userId: string): Promise<StudentTranscriptResult> {
        return prisma.$transaction(
            (tx) => this.getMyTranscriptInTransaction(tx, userId),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    /**
     * Get student semester history with IPK calculation.
     * Used by GET /api/v1/students/:id/history-semester
     */
    static async getStudentSemesterHistory(
        userId: string
    ): Promise<{ riwayatSemester: SemesterRecord[] }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                mahasiswa: {
                    select: {
                        id: true,
                        angkatan: true,
                    },
                },
            },
        });

        if (!user || user.role !== "Mahasiswa" || !user.mahasiswa) {
            throw {
                name: "NotFound",
                message: "Mahasiswa tidak ditemukan",
            };
        }

        const mahasiswaId = user.mahasiswa.id;
        const angkatan = user.mahasiswa.angkatan;

        const krsRows = await prisma.kRS.findMany({
            where: { mahasiswaId },
            select: {
                id: true,
                status: true,
                tahunAkademik: {
                    select: {
                        id: true,
                        tahun: true,
                        semester: true,
                    },
                },
                details: {
                    select: {
                        id: true,
                        kelasMataKuliah: {
                            select: {
                                mataKuliah: {
                                    select: {
                                        sks: true,
                                    },
                                },
                            },
                        },
                        transkrip: {
                            where: { mahasiswaId },
                            select: { bobot: true },
                        },
                    },
                },
            },
        });

        const semesterOrder = { GANJIL: 1, GENAP: 2 } as const;
        const getStartYear = (tahun: string) => Number(tahun.split("/")[0]);
        const getSemesterNumber = (tahun: string, semester: keyof typeof semesterOrder) =>
            (getStartYear(tahun) - angkatan) * 2 + semesterOrder[semester];
        const round = (value: number) => Math.round(value * 100) / 100;

        const orderedKrsRows = [...krsRows].sort((a, b) => {
            const yearA = getStartYear(a.tahunAkademik.tahun);
            const yearB = getStartYear(b.tahunAkademik.tahun);
            if (yearA !== yearB) return yearA - yearB;
            return semesterOrder[a.tahunAkademik.semester] - semesterOrder[b.tahunAkademik.semester];
        });

        let cumulativeSks = 0;
        let cumulativeGradePoints = 0;

        const riwayatSemester = orderedKrsRows.map((krs) => {
            const gradedDetails = krs.details.filter((detail) => detail.transkrip[0]?.bobot != null);
            const sks = gradedDetails.reduce((total, detail) => total + detail.kelasMataKuliah.mataKuliah.sks, 0);
            const gradePoints = gradedDetails.reduce((total, detail) => {
                const bobot = Number(detail.transkrip[0]!.bobot);
                return total + bobot * detail.kelasMataKuliah.mataKuliah.sks;
            }, 0);

            cumulativeSks += sks;
            cumulativeGradePoints += gradePoints;

            const ips = sks > 0 ? round(gradePoints / sks) : 0;
            const ipk = cumulativeSks > 0 ? round(cumulativeGradePoints / cumulativeSks) : 0;

            return {
                semester: getSemesterNumber(krs.tahunAkademik.tahun, krs.tahunAkademik.semester as keyof typeof semesterOrder),
                tahunAkademik: {
                    id: krs.tahunAkademik.id,
                    tahun: krs.tahunAkademik.tahun,
                    semester: krs.tahunAkademik.semester,
                    label: `${krs.tahunAkademik.tahun} ${krs.tahunAkademik.semester === "GANJIL" ? "Ganjil" : "Genap"}`,
                },
                sks,
                ips,
                ipk,
                status: krs.status,
            };
        });

        return { riwayatSemester };
    }

    /**
     * Get student KRS for a specific academic year.
     * Used by GET /api/v1/students/:id/krs
     */
    static async getStudentKRS(
        userId: string,
        tahunAkademikId: number
    ): Promise<{ krs: KRSData | null }> {
        const user = await prisma.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true } } },
        });

        if (!user?.mahasiswa) {
            throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
        }

        const krs = await prisma.kRS.findUnique({
            where: {
                mahasiswaId_tahunAkademikId: {
                    mahasiswaId: user.mahasiswa.id,
                    tahunAkademikId,
                },
            },
            select: {
                id: true,
                status: true,
                tahunAkademik: {
                    select: {
                        id: true,
                        tahun: true,
                        semester: true,
                    },
                },
                details: {
                    select: {
                        id: true,
                        status: true,
                        kelasMataKuliah: {
                            select: {
                                mataKuliah: {
                                    select: {
                                        id: true,
                                        kode: true,
                                        nama: true,
                                        sks: true,
                                    },
                                },
                                kelas: {
                                    select: {
                                        id: true,
                                        nama: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!krs) {
            return { krs: null };
        }

        const labelSemester = krs.tahunAkademik.semester === "GANJIL" ? "Ganjil" : "Genap";

        const details = krs.details.map((detail) => ({
            id: detail.id,
            mataKuliah: {
                id: detail.kelasMataKuliah.mataKuliah.id,
                kode: detail.kelasMataKuliah.mataKuliah.kode,
                nama: detail.kelasMataKuliah.mataKuliah.nama,
                sks: detail.kelasMataKuliah.mataKuliah.sks,
            },
            kelas: {
                id: detail.kelasMataKuliah.kelas.id,
                nama: detail.kelasMataKuliah.kelas.nama,
            },
            status: detail.status,
        }));

        const totalSKS = details.reduce((total, detail) => total + detail.mataKuliah.sks, 0);

        return {
            krs: {
                id: krs.id,
                tahunAkademik: {
                    id: krs.tahunAkademik.id,
                    tahun: krs.tahunAkademik.tahun,
                    semester: krs.tahunAkademik.semester,
                    label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                },
                status: krs.status,
                totalSKS,
                details,
            },
        };
    }

    /**
     * Get student grades/transcript for a specific academic year.
     * Used by GET /api/v1/students/:id/nilai
     */
    private static async getStudentNilaiInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        tahunAkademikId: number
    ): Promise<NilaiResult> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true } } },
        });

        if (!user?.mahasiswa) {
            throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
        }

        const year = await prismaClient.tahunAkademik.findUnique({
            where: { id: tahunAkademikId },
            select: { id: true, tahun: true, semester: true },
        });

        if (!year) {
            throw { name: "NotFound", message: "Tahun akademik tidak ditemukan" };
        }

        const records = await prismaClient.kRS.findMany({
            where: {
                mahasiswaId: user.mahasiswa.id,
                status: "DISETUJUI",
                tahunAkademik: {
                    OR: [
                        { tahun: { lt: year.tahun } },
                        {
                            tahun: year.tahun,
                            semester: { in: year.semester === "GANJIL" ? [Semester.GANJIL] : [Semester.GANJIL, Semester.GENAP] },
                        },
                    ],
                },
            },
            select: {
                tahunAkademikId: true,
                tahunAkademik: { select: { tahun: true, semester: true } },
                details: {
                    where: { status: "DISETUJUI" },
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
                        kelasMataKuliah: {
                            select: {
                                mataKuliah: {
                                    select: {
                                        id: true,
                                        kode: true,
                                        nama: true,
                                        sks: true,
                                    },
                                },
                            },
                        },
                        transkrip: {
                            where: { mahasiswaId: user.mahasiswa.id },
                            select: { nilaiAngka: true, nilaiHuruf: true, bobot: true },
                        },
                    },
                },
            },
        }) as KRSRecordForNilai[];

        const current = records.find((record) => record.tahunAkademikId === year.id);
        if (!current) {
            const pendingKrs = await prismaClient.kRS.findUnique({
                where: { mahasiswaId_tahunAkademikId: { mahasiswaId: user.mahasiswa.id, tahunAkademikId } },
                select: { status: true },
            });
            return { nilai: null, reason: pendingKrs ? "KRS_NOT_APPROVED" : "KRS_NOT_FOUND" };
        }

        const normalized = new Map<number, typeof current.details>();
        for (const record of records) {
            const unique = new Map<number, (typeof current.details)[number]>();
            for (const detail of record.details) {
                const grade = detail.transkrip[0];
                const course = detail.kelasMataKuliah.mataKuliah;
                if (!Number.isInteger(course.sks) || course.sks <= 0) {
                    throw { name: "Conflict", message: `SKS ${course.kode} tidak valid.` };
                }
                if (grade?.bobot != null && (!Number.isFinite(Number(grade.bobot)) || Number(grade.bobot) < 0 || Number(grade.bobot) > 4)) {
                    throw { name: "Conflict", message: `Bobot nilai ${course.kode} harus antara 0 dan 4.` };
                }
                if (grade?.nilaiAngka != null && (!Number.isFinite(Number(grade.nilaiAngka)) || Number(grade.nilaiAngka) < 0 || Number(grade.nilaiAngka) > 100)) {
                    throw { name: "Conflict", message: `Nilai angka ${course.kode} harus antara 0 dan 100.` };
                }
                if (grade?.bobot == null || grade.nilaiAngka == null || !grade.nilaiHuruf?.trim()) continue;
                const previous = unique.get(course.id)?.transkrip[0];
                if (previous && (Number(previous.bobot) !== Number(grade.bobot) || Number(previous.nilaiAngka) !== Number(grade.nilaiAngka) || previous.nilaiHuruf?.trim() !== grade.nilaiHuruf.trim())) {
                    throw { name: "Conflict", message: `Terdapat nilai berbeda untuk ${course.kode} pada semester yang sama. Perbaiki duplikasi KRS terlebih dahulu.` };
                }
                if (!unique.has(course.id)) unique.set(course.id, detail);
            }
            normalized.set(record.tahunAkademikId, [...unique.values()]);
        }

        const details = normalized.get(year.id)!.map((detail) => ({
            id: detail.id,
            mataKuliah: detail.kelasMataKuliah.mataKuliah,
            nilai: detail.transkrip[0].nilaiAngka == null ? null : Number(detail.transkrip[0].nilaiAngka),
            grade: detail.transkrip[0].nilaiHuruf ?? null,
            bobot: Number(detail.transkrip[0].bobot),
        }));

        const latest = new Map<number, { sks: number; bobot: number }>();
        const sorted = [...records].sort((a, b) =>
            a.tahunAkademik.tahun.localeCompare(b.tahunAkademik.tahun) ||
            (a.tahunAkademik.semester === "GANJIL" ? 0 : 1) - (b.tahunAkademik.semester === "GANJIL" ? 0 : 1)
        );
        for (const record of sorted) {
            for (const detail of normalized.get(record.tahunAkademikId) ?? []) {
                const grade = detail.transkrip[0];
                if (grade?.bobot == null) continue;
                const course = detail.kelasMataKuliah.mataKuliah;
                latest.set(course.id, { sks: course.sks, bobot: Number(grade.bobot) });
            }
        }

        const calculate = (grades: { sks: number; bobot: number }[]) => {
            const sks = grades.reduce((sum, grade) => sum + grade.sks, 0);
            const points = grades.reduce((sum, grade) => sum + grade.sks * grade.bobot, 0);
            return { sks, ip: sks ? Math.round(points / sks * 100) / 100 : 0 };
        };

        const semester = calculate(details.map((detail) => ({ sks: detail.mataKuliah.sks, bobot: detail.bobot })));
        const cumulative = calculate([...latest.values()]);

        return {
            nilai: {
                tahunAkademik: { ...year, label: `${year.tahun} ${year.semester === "GANJIL" ? "Ganjil" : "Genap"}` },
                details,
                summary: { totalSKS: semester.sks, ips: semester.ip, ipk: cumulative.ip },
            },
            reason: details.length ? null : "GRADES_NOT_AVAILABLE",
        };
    }


    private static async getMyTranscriptInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string
    ): Promise<StudentTranscriptResult> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true, angkatan: true } } },
        });
        if (!user?.mahasiswa) throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
        const mahasiswa = user.mahasiswa;

        const records = await prismaClient.kRS.findMany({
            where: { mahasiswaId: mahasiswa.id, status: "DISETUJUI" },
            select: {
                tahunAkademik: { select: { id: true, tahun: true, semester: true } },
                details: {
                    where: { status: "DISETUJUI" },
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
                        kelasMataKuliah: { select: { mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } } } },
                        transkrip: {
                            where: { mahasiswaId: mahasiswa.id },
                            select: { nilaiAngka: true, nilaiHuruf: true, bobot: true },
                        },
                    },
                },
            },
        });

        const round = (value: number) => Math.round(value * 100) / 100;
        const latest = new Map<number, { sks: number; bobot: number }>();
        const orderedRecords = [...records].sort((first, second) =>
            first.tahunAkademik.tahun.localeCompare(second.tahunAkademik.tahun) ||
            (first.tahunAkademik.semester === "GANJIL" ? 0 : 1) - (second.tahunAkademik.semester === "GANJIL" ? 0 : 1)
        );
        const semesters = orderedRecords.map((record) => {
            const unique = new Map<number, (typeof record.details)[number]>();
            for (const detail of record.details) {
                const course = detail.kelasMataKuliah.mataKuliah;
                const grade = detail.transkrip[0];
                if (!Number.isInteger(course.sks) || course.sks <= 0) {
                    throw { name: "Conflict", message: `SKS ${course.kode} tidak valid.` };
                }
                if (!grade || grade.bobot == null || grade.nilaiAngka == null || !grade.nilaiHuruf?.trim()) continue;
                const bobot = Number(grade.bobot);
                const nilai = Number(grade.nilaiAngka);
                if (!Number.isFinite(bobot) || bobot < 0 || bobot > 4) {
                    throw { name: "Conflict", message: `Bobot nilai ${course.kode} harus antara 0 dan 4.` };
                }
                if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
                    throw { name: "Conflict", message: `Nilai angka ${course.kode} harus antara 0 dan 100.` };
                }
                const previous = unique.get(course.id)?.transkrip[0];
                if (previous && (Number(previous.bobot) !== bobot || Number(previous.nilaiAngka) !== nilai || previous.nilaiHuruf?.trim() !== grade.nilaiHuruf.trim())) {
                    throw { name: "Conflict", message: `Terdapat nilai berbeda untuk ${course.kode} pada semester yang sama. Perbaiki duplikasi KRS terlebih dahulu.` };
                }
                if (!unique.has(course.id)) unique.set(course.id, detail);
            }

            const courses = [...unique.values()].map((detail) => {
                const course = detail.kelasMataKuliah.mataKuliah;
                const grade = detail.transkrip[0]!;
                latest.set(course.id, { sks: course.sks, bobot: Number(grade.bobot) });
                return {
                    id: detail.id,
                    mataKuliah: course,
                    nilai: Number(grade.nilaiAngka),
                    grade: grade.nilaiHuruf,
                    bobot: Number(grade.bobot),
                };
            });
            const totalCredits = courses.reduce((sum, course) => sum + course.mataKuliah.sks, 0);
            const points = courses.reduce((sum, course) => sum + course.mataKuliah.sks * course.bobot, 0);
            const startYear = Number(record.tahunAkademik.tahun.split("/")[0]);
            return {
                id: record.tahunAkademik.id,
                semesterNumber: (startYear - mahasiswa.angkatan) * 2 + (record.tahunAkademik.semester === "GANJIL" ? 1 : 2),
                academicYear: {
                    ...record.tahunAkademik,
                    label: `${record.tahunAkademik.tahun} ${record.tahunAkademik.semester === "GANJIL" ? "Ganjil" : "Genap"}`,
                },
                semesterGpa: totalCredits ? round(points / totalCredits) : 0,
                totalCredits,
                courses,
            };
        }).filter((semester) => semester.courses.length > 0).sort((a, b) => b.semesterNumber - a.semesterNumber);

        const completedCredits = [...latest.values()].reduce((sum, grade) => sum + grade.sks, 0);
        const gradePoints = [...latest.values()].reduce((sum, grade) => sum + grade.sks * grade.bobot, 0);
        return {
            cumulativeGpa: completedCredits ? round(gradePoints / completedCredits) : 0,
            completedCredits,
            semesters,
        };
    }
}
