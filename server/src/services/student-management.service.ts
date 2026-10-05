import { Prisma } from "@prisma/client";
import { S3Service } from "./s3.service";

export interface StudentResponse {
    id: string;
    avatarUrl: string | null;
    nim: string;
    nama: string;
    nik: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
    jenisKelamin: "L" | "P" | null;
    status: string;
    riwayatStatus: Array<{
        id: string;
        statusBaru: string;
        alasan: string | null;
        tanggal: Date;
    }>;
    email: string;
    noHp: string | null;
    alamat: string | null;
    angkatan: number;
    prodi: {
        id: number;
        nama: string;
    } | null;
    fakultas: {
        id: number;
        nama: string;
    } | null;
    kurikulum: {
        id: number;
        kode: string;
        nama: string;
        tahun: number;
    } | null;
    dosenPembimbing: {
        id: string;
        nama: string;
    } | null;
    summary: {
        ipk: number;
        totalSKS: number;
        semester: number;
        kehadiran: null;
    };
}

export interface StudentListResponse {
    students: Array<{
        id: string;
        name: string;
        role: string;
        avatarUrl: string | null;
        mahasiswa: {
            id: string;
            nim: string;
            status: string;
            semester: number;
            prodi: {
                name: string;
            };
        } | null;
    }>;
    pagination: {
        page: number;
        limit: number;
        totalRows: number;
        totalPages: number;
    };
}

export class StudentManagementService {
    /**
     * Get paginated list of all students with search and sorting.
     * Used by GET /api/v1/students
     */
    static async getAllStudents(
        prismaClient: Prisma.TransactionClient,
        page: number,
        limit: number,
        search: string,
        sortBy: string,
        sortOrder: "asc" | "desc"
    ): Promise<StudentListResponse> {
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            role: "Mahasiswa",
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        { mahasiswa: { nim: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                    ],
                }
                : {}),
        };

        const sortableFields: Record<string, Prisma.UserOrderByWithRelationInput> = {
            name: { name: sortOrder },
            nim: { mahasiswa: { nim: sortOrder } },
            semester: { mahasiswa: { semester: sortOrder } },
        };

        const orderBy = sortableFields[sortBy] ?? { name: sortOrder };

        const [students, totalRows] = await Promise.all([
            prismaClient.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    avatarUrl: true,
                    mahasiswa: {
                        select: {
                            id: true,
                            nim: true,
                            status: true,
                            semester: true,
                            prodi: {
                                select: { name: true },
                            },
                        },
                    },
                },
            }),
            prismaClient.user.count({ where }),
        ]);

        return {
            students: students.map((student) => ({
                ...student,
                avatarUrl: student.avatarUrl ?? null,
            })),
            pagination: {
                page,
                limit,
                totalRows,
                totalPages: Math.max(1, Math.ceil(totalRows / limit)),
            },
        };
    }

    /**
     * Get detailed student information by user ID.
     * Used by GET /api/v1/students/:id
     */
    static async getStudentById(
        prismaClient: Prisma.TransactionClient,
        userId: string
    ): Promise<StudentResponse> {
        const student = await prismaClient.user.findUnique({
            where: {
                id: userId,
                role: "Mahasiswa",
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                address: true,
                birthDate: true,
                gender: true,
                nik: true,
                birthPlace: true,
                avatarKey: true,
                mahasiswa: {
                    select: {
                        id: true,
                        nim: true,
                        angkatan: true,
                        semester: true,
                        status: true,
                        riwayatStatus: {
                            orderBy: {
                                tanggal: "desc",
                            },
                            select: {
                                id: true,
                                statusBaru: true,
                                alasan: true,
                                tanggal: true,
                            },
                        },
                        prodi: {
                            select: {
                                id: true,
                                name: true,
                                fakultas: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                kurikulum: {
                                    where: {
                                        isActive: true,
                                    },
                                    orderBy: {
                                        tahun: "desc",
                                    },
                                    take: 1,
                                    select: {
                                        id: true,
                                        kode: true,
                                        nama: true,
                                        tahun: true,
                                    },
                                },
                            },
                        },
                        dosen: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        krs: {
                            select: {
                                tahunAkademik: {
                                    select: {
                                        tahun: true,
                                        semester: true,
                                    },
                                },
                                details: {
                                    select: {
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
                                            select: {
                                                bobot: true,
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

        let avatarUrl: string | null = null;

        if (student?.avatarKey) {
            avatarUrl = await S3Service.createReadUrl(student.avatarKey);
        }

        if (!student || !student.mahasiswa) {
            throw {
                name: "NotFound",
                message: "Mahasiswa tidak ditemukan",
            };
        }

        const mahasiswa = student.mahasiswa;
        const jenisKelamin = student.gender === "Male" ? "L" : student.gender === "Female" ? "P" : null;
        const tanggalLahir = student.birthDate
            ? new Date(student.birthDate).toISOString().split("T")[0]
            : null;
        const semesterOrder = {
            GANJIL: 1,
            GENAP: 2,
        } as const;
        const getStartYear = (tahun: string) => Number(tahun.split("/")[0]);
        const round = (value: number) => Math.round(value * 100) / 100;

        const gradedDetails = mahasiswa.krs.flatMap((krs) =>
            krs.details
                .filter((detail) => detail.transkrip[0]?.bobot != null)
                .map((detail) => ({
                    sks: detail.kelasMataKuliah.mataKuliah.sks,
                    bobot: Number(detail.transkrip[0]!.bobot),
                }))
        );
        const totalSKS = gradedDetails.reduce((total, detail) => total + detail.sks, 0);
        const totalGradePoints = gradedDetails.reduce(
            (total, detail) => total + detail.sks * detail.bobot,
            0
        );
        const calculatedSemester = mahasiswa.krs.reduce((latest, krs) => {
            const currentSemester =
                (getStartYear(krs.tahunAkademik.tahun) - mahasiswa.angkatan) * 2 +
                semesterOrder[krs.tahunAkademik.semester];
            return Math.max(latest, currentSemester);
        }, mahasiswa.semester);

        return {
            id: student.id,
            avatarUrl,
            nim: mahasiswa.nim,
            nama: student.name,
            nik: student.nik ?? null,
            tempatLahir: student.birthPlace ?? null,
            tanggalLahir,
            jenisKelamin,
            status: mahasiswa.status,
            riwayatStatus: mahasiswa.riwayatStatus,
            email: student.email,
            noHp: student.phoneNumber ?? null,
            alamat: student.address ?? null,
            angkatan: mahasiswa.angkatan,
            prodi: mahasiswa.prodi
                ? {
                    id: mahasiswa.prodi.id,
                    nama: mahasiswa.prodi.name,
                }
                : null,
            fakultas: mahasiswa.prodi?.fakultas
                ? {
                    id: mahasiswa.prodi.fakultas.id,
                    nama: mahasiswa.prodi.fakultas.name,
                }
                : null,
            kurikulum: mahasiswa.prodi?.kurikulum[0]
                ? {
                    id: mahasiswa.prodi.kurikulum[0].id,
                    kode: mahasiswa.prodi.kurikulum[0].kode,
                    nama: mahasiswa.prodi.kurikulum[0].nama,
                    tahun: mahasiswa.prodi.kurikulum[0].tahun,
                }
                : null,
            dosenPembimbing: mahasiswa.dosen?.user
                ? {
                    id: mahasiswa.dosen.id,
                    nama: mahasiswa.dosen.user.name,
                }
                : null,
            summary: {
                ipk: totalSKS > 0 ? round(totalGradePoints / totalSKS) : 0,
                totalSKS,
                semester: calculatedSemester,
                kehadiran: null,
            },
        };
    }
}
