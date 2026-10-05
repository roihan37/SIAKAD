import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { AvatarService } from "./avatar.service";
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
    static async bulkUpdateStatus(ids: unknown, status: unknown, statusReason: unknown) {
        if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 ||
            !ids.every((id: unknown) => typeof id === "string" && id.trim())) {
            throw { name: "BadRequest", message: "Pilih 1 sampai 100 mahasiswa yang valid" };
        }
        if (status !== "Aktif" && status !== "Cuti" && status !== "Lulus" && status !== "Nonaktif") {
            throw { name: "BadRequest", message: "Status mahasiswa tidak valid" };
        }
        if (typeof statusReason !== "string" || !statusReason.trim() || statusReason.trim().length > 1000) {
            throw { name: "BadRequest", message: "Alasan wajib diisi, maksimal 1000 karakter" };
        }
        const userIds = [...new Set<string>(ids.map((id: string) => id.trim()))];
        const changedCount = await prisma.$transaction(
            (tx) => this.bulkUpdateStatusInTransaction(tx, userIds, status, statusReason),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
        return { ids: userIds, changedCount, status };
    }

    static async createStudent(body: Parameters<typeof StudentManagementService.createStudentInTransaction>[1]) {
        try {
            return await prisma.$transaction(
                (tx) => this.createStudentInTransaction(tx, body),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
        } catch (error) {
            // Cleanup follows transaction failure, including verification and commit failures.
            await this.cleanupCreateAvatar(body.avatarKey);
            throw error;
        }
    }

    // Also used when sending the create response fails after a successful commit.
    static async cleanupCreateAvatar(avatarKey?: string) {
        if (avatarKey) {
            try {
                await AvatarService.deleteObject(avatarKey);
            } catch (cleanupError) {
                console.error("Failed to cleanup avatar:", cleanupError);
            }
        }
    }

    static async deleteUserById(userId: string) {
        const student = await prisma.$transaction(
            (tx) => this.deleteUserByIdInTransaction(tx, userId),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
        // A storage failure must not turn a committed deletion into an HTTP failure.
        if (student.avatarKey) {
            try {
                await S3Service.deleteUrl(student.avatarKey);
            } catch (error) {
                console.error("Gagal menghapus avatar mahasiswa:", error);
            }
        }
        return student;
    }

    static async bulkDelete(userIds: string[]) {
        const students = await prisma.$transaction(
            (tx) => this.bulkDeleteInTransaction(tx, userIds),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
        // Deduplicate keys and clean up only after commit, in batches of five.
        const avatarKeys = [...new Set(students.flatMap((student) => student.avatarKey ? [student.avatarKey] : []))];
        for (let index = 0; index < avatarKeys.length; index += 5) {
            await Promise.all(avatarKeys.slice(index, index + 5).map(async (key) => {
                try {
                    await S3Service.deleteUrl(key);
                } catch (error) {
                    console.error("Gagal menghapus avatar mahasiswa:", error);
                }
            }));
        }
        return students;
    }


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

    /**
     * Bulk update student status with history tracking.
     * Used by PATCH /api/v1/students/bulk/status
     */
    private static async bulkUpdateStatusInTransaction(
        tx: Prisma.TransactionClient,
        userIds: string[],
        status: string,
        statusReason: string
    ): Promise<number> {
        const users = await tx.user.findMany({
            where: { id: { in: userIds }, role: "Mahasiswa" },
            select: { mahasiswa: { select: { id: true, status: true } } },
        });

        if (users.length !== userIds.length || users.some((user) => !user.mahasiswa)) {
            throw { name: "NotFound", message: "Satu atau lebih mahasiswa tidak ditemukan" };
        }

        const changed = users.flatMap((user) => user.mahasiswa && user.mahasiswa.status !== status ? [user.mahasiswa] : []);
        
        for (const student of changed) {
            await tx.mahasiswa.update({ where: { id: student.id }, data: { status: status as any } });
            await tx.riwayatStatusMahasiswa.create({ data: {
                mahasiswaId: student.id, statusLama: student.status,
                statusBaru: status as any, alasan: statusReason.trim(),
            } });
        }

        return changed.length;
    }

    /**
     * Create a new student account with avatar handling.
     * Used by POST /api/v1/students
     */
    private static async createStudentInTransaction(
        tx: Prisma.TransactionClient,
        body: {
            name: string;
            email: string;
            nik: string;
            birthPlace: string;
            username: string;
            password: string;
            phoneNumber: string;
            gender: string;
            address: string;
            nim: string;
            angkatan: number;
            semester: number;
            status: string;
            prodiId: number;
            birthDate: string;
            avatarKey?: string;
            dosenId?: string;
        },
    ): Promise<{ id: string; name: string }> {
        const {
            name, email, nik, birthPlace, username, password, phoneNumber, gender, address,
            nim, angkatan, semester, status, prodiId, birthDate, avatarKey, dosenId
        } = body;

        const hash = await hashPassword(password);
        let avatarUrl: string | undefined;

        if (avatarKey) {
            await AvatarService.verifyKey(avatarKey);
            avatarUrl = AvatarService.getPublicUrl(avatarKey);
        }

        const user = await tx.user.create({
            data: {
                name,
                email,
                username,
                password: hash,
                birthDate,
                role: "Mahasiswa",
                phoneNumber,
                gender: gender as any,
                address,
                nik,
                birthPlace,
                avatarKey,
                avatarUrl
            }
        });

        await tx.mahasiswa.create({
            data: {
                nim,
                angkatan,
                semester,
                status: status as any,
                prodiId,
                userId: user.id,
                dosenId
            }
        });

        return { id: user.id, name: user.name };
    }

    /**
     * Delete a student by user ID with cascading deletes.
     * Used by DELETE /api/v1/students/:id
     */
    private static async deleteUserByIdInTransaction(
        tx: Prisma.TransactionClient,
        userId: string
    ): Promise<{ id: string; name: string; avatarKey: string | null }> {
        const user = await tx.user.findUnique({
            where: { id: userId, role: "Mahasiswa" },
            select: {
                id: true,
                name: true,
                avatarKey: true,
                mahasiswa: { select: { id: true } },
            },
        });

        if (!user || !user.mahasiswa) {
            throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
        }

        const mahasiswaId = user.mahasiswa.id;

        // Hapus relasi dari anak ke induk agar tidak melanggar foreign key.
        await tx.transkrip.deleteMany({ where: { mahasiswaId } });
        await tx.kRSDetail.deleteMany({
            where: { krs: { mahasiswaId } },
        });
        await tx.kRS.deleteMany({ where: { mahasiswaId } });

        // Mahasiswa, riwayat status, dan refresh token mengikuti onDelete: Cascade.
        await tx.user.delete({ where: { id: user.id } });
        return user;
    }

    /**
     * Bulk delete multiple students by user IDs.
     * Used by DELETE /api/v1/students/bulk
     */
    private static async bulkDeleteInTransaction(
        tx: Prisma.TransactionClient,
        userIds: string[]
    ): Promise<Array<{ id: string; avatarKey: string | null }>> {
        const users = await tx.user.findMany({
            where: { id: { in: userIds }, role: "Mahasiswa" },
            select: {
                id: true,
                avatarKey: true,
                mahasiswa: { select: { id: true } },
            },
        });

        // Validasi seluruh target sebelum menghapus data apa pun.
        if (users.length !== userIds.length || users.some((user) => !user.mahasiswa)) {
            throw { name: "NotFound", message: "Satu atau lebih mahasiswa tidak ditemukan" };
        }

        const mahasiswaIds = users.map((user) => user.mahasiswa!.id);
        await tx.transkrip.deleteMany({ where: { mahasiswaId: { in: mahasiswaIds } } });
        await tx.kRSDetail.deleteMany({
            where: { krs: { mahasiswaId: { in: mahasiswaIds } } },
        });
        await tx.kRS.deleteMany({ where: { mahasiswaId: { in: mahasiswaIds } } });

        // Profil mahasiswa, riwayat status, dan refresh token dihapus melalui cascade.
        const deleted = await tx.user.deleteMany({
            where: { id: { in: userIds }, role: "Mahasiswa" },
        });
        if (deleted.count !== userIds.length) {
            throw { name: "NotFound", message: "Data mahasiswa berubah, silakan ulangi penghapusan" };
        }
        return users;
    }
}
