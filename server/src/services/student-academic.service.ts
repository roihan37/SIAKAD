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
    /**
     * Get student semester history with IPK calculation.
     * Used by GET /api/v1/students/:id/history-semester
     */
    static async getStudentSemesterHistory(
        prismaClient: Prisma.TransactionClient,
        userId: string
    ): Promise<{ riwayatSemester: SemesterRecord[] }> {
        const user = await prismaClient.user.findUnique({
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

        const krsRows = await prismaClient.kRS.findMany({
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
        prismaClient: Prisma.TransactionClient,
        userId: string,
        tahunAkademikId: number
    ): Promise<{ krs: KRSData | null }> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true } } },
        });

        if (!user?.mahasiswa) {
            throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
        }

        const krs = await prismaClient.kRS.findUnique({
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
    static async getStudentNilai(
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
                        ...(year.semester === "GANJIL"
                            ? [{ tahun: year.tahun, semester: year.semester as Semester }]
                            : []),
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
                    throw { name: "Conflict", message: `Bobot nilai ${course.kode} harus antara 0 и 4.` };
                }
                if (grade?.nilaiAngka != null && (!Number.isFinite(Number(grade.nilaiAngka)) || Number(grade.nilaiAngka) < 0 || Number(grade.nilaiAngka) > 100)) {
                    throw { name: "Conflict", message: `Nilai angka ${course.kode} должен быть between 0 and 100.` };
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
}
