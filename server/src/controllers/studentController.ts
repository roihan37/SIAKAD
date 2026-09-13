import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { Prisma } from "@prisma/client";
import { AvatarService } from "../services/avatar.service";
import { S3Service } from "../services/s3.service";

export class Controller {

    static async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { ids, status, statusReason } = req.body;
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
            const changedCount = await prisma.$transaction(async (tx) => {
                const users = await tx.user.findMany({
                    where: { id: { in: userIds }, role: "Mahasiswa" },
                    select: { mahasiswa: { select: { id: true, status: true } } },
                });
                if (users.length !== userIds.length || users.some((user) => !user.mahasiswa)) {
                    throw { name: "NotFound", message: "Satu atau lebih mahasiswa tidak ditemukan" };
                }
                const changed = users.flatMap((user) => user.mahasiswa && user.mahasiswa.status !== status ? [user.mahasiswa] : []);
                for (const student of changed) {
                    await tx.mahasiswa.update({ where: { id: student.id }, data: { status } });
                    await tx.riwayatStatusMahasiswa.create({ data: {
                        mahasiswaId: student.id, statusLama: student.status,
                        statusBaru: status, alasan: statusReason.trim(),
                    } });
                }
                return changed.length;
            });
            return res.status(200).json({ message: `${changedCount} mahasiswa berhasil diperbarui`, data: { ids: userIds, changedCount, status } });
        } catch (error) { next(error); }
    }

    static async createStudent(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        const {
            name, email, nik, birthPlace, username, password, phoneNumber, gender, address,
            nim, angkatan, semester, status, prodiId, birthDate, avatarKey, dosenId
        } = req.body
        try {

            // console.log(req.body);
            const hash = await hashPassword(password)
            let avatarUrl: string | undefined;

            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
            }

            const newUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name,
                        email,
                        username,
                        password: hash,
                        birthDate,
                        role: "Mahasiswa",
                        phoneNumber,
                        gender,
                        address,
                        nik,
                        birthPlace,
                        avatarKey,
                        avatarUrl
                    }
                })

                await tx.mahasiswa.create({
                    data: {
                        nim,
                        angkatan,
                        semester,
                        status,
                        prodiId,
                        userId: user.id,
                        dosenId
                    }
                })
                return user
            })

            // console.log(newUser, '<< NEW USERS');

            res.status(201).json({
                message: `${newUser.name} created successfully`
            })

        } catch (error) {

            if (avatarKey) {
                try {
                    await AvatarService.deleteObject(
                        avatarKey
                    );
                } catch (cleanupError) {
                    console.error(
                        "Failed to cleanup avatar:",
                        cleanupError
                    );
                }
            }

            next(error)
        }
    }

    static async updateStudentById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        
        let newAvatarKeyForCleanup: string | null = null;

        try {
            const userId = String(req.params.id);
            
            const {
                name,
                email,
                username,
                password,
                phoneNumber,
                gender,
                address,
                nik,
                birthPlace,
                nim,
                angkatan,
                semester,
                status,
                statusReason,
                prodiId,
                birthDate,
                avatarKey,
                dosenId,
            } = req.body;

            // ==========================================
            // 1. Cari User + Mahasiswa
            // ==========================================
            const existingUser =
                await prisma.user.findUnique({
                    where: {
                        id: userId,
                    },
                    select: {
                        id: true,
                        avatarKey: true,

                        mahasiswa: {
                            select: {
                                id: true,
                                nim: true,
                                angkatan: true,
                                semester: true,
                                status: true,
                                prodiId: true,
                                dosenId: true,
                            },
                        },
                    },
                });

            if (!existingUser) {
                throw {
                    name: "NotFound",
                    message: "User tidak ditemukan",
                };
            }

            if (!existingUser.mahasiswa) {
                throw {
                    name: "BadRequest",
                    message: "User ini bukan mahasiswa",
                };
            }

            const mahasiswa =
                existingUser.mahasiswa;

            const oldAvatarKey =
                existingUser.avatarKey;

            const oldStatus =
                mahasiswa.status;

            // ==========================================
            // 2. Cek perubahan status
            // ==========================================
            const statusChanged =
                status !== undefined &&
                status !== oldStatus;

            // ==========================================
            // 3. Validasi alasan status
            // ==========================================
            if (statusChanged) {
                if (
                    statusReason === undefined ||
                    statusReason === null ||
                    String(statusReason).trim() === ""
                ) {
                    throw {
                        name: "BadRequest",
                        message:
                            "Alasan perubahan status wajib diisi",
                    };
                }
            }

            // Kalau status tidak berubah,
            // statusReason tidak perlu diproses.
            const parsedStatusReason =
                statusChanged
                    ? String(statusReason).trim()
                    : undefined;

            // ==========================================
            // 4. Parse & Validate Birth Date
            // ==========================================
            let parsedBirthDate:
                | Date
                | null
                | undefined;

            if (birthDate !== undefined) {
                if (
                    birthDate === null ||
                    birthDate === ""
                ) {
                    parsedBirthDate = null;
                } else {
                    const birthDateString =
                        String(birthDate);

                    const dateRegex =
                        /^\d{4}-\d{2}-\d{2}$/;

                    if (
                        !dateRegex.test(
                            birthDateString
                        )
                    ) {
                        throw {
                            name: "BadRequest",
                            message:
                                "birthDate harus menggunakan format YYYY-MM-DD",
                        };
                    }

                    const [
                        year,
                        month,
                        day,
                    ] = birthDateString
                        .split("-")
                        .map(Number);

                    const date = new Date(
                        Date.UTC(
                            year,
                            month - 1,
                            day
                        )
                    );

                    if (
                        date.getUTCFullYear() !==
                        year ||
                        date.getUTCMonth() !==
                        month - 1 ||
                        date.getUTCDate() !==
                        day
                    ) {
                        throw {
                            name: "BadRequest",
                            message:
                                "birthDate tidak valid",
                        };
                    }

                    parsedBirthDate = date;
                }
            }

            // ==========================================
            // 5. Parse Angkatan
            // ==========================================
            let parsedAngkatan:
                | number
                | undefined;

            if (angkatan !== undefined) {
                parsedAngkatan = Number(
                    angkatan
                );

                if (
                    !Number.isInteger(
                        parsedAngkatan
                    ) ||
                    parsedAngkatan <= 0
                ) {
                    throw {
                        name: "BadRequest",
                        message:
                            "angkatan harus berupa angka positif",
                    };
                }
            }

            // ==========================================
            // 6. Parse Semester
            // ==========================================
            let parsedSemester:
                | number
                | undefined;

            if (semester !== undefined) {
                parsedSemester = Number(
                    semester
                );

                if (
                    !Number.isInteger(
                        parsedSemester
                    ) ||
                    parsedSemester <= 0
                ) {
                    throw {
                        name: "BadRequest",
                        message:
                            "semester harus berupa angka positif",
                    };
                }
            }

            // ==========================================
            // 7. Parse Prodi
            // ==========================================
            let parsedProdiId:
                | number
                | undefined;

            if (prodiId !== undefined) {
                parsedProdiId = Number(
                    prodiId
                );

                if (
                    !Number.isInteger(
                        parsedProdiId
                    ) ||
                    parsedProdiId <= 0
                ) {
                    throw {
                        name: "BadRequest",
                        message:
                            "prodiId harus berupa angka positif",
                    };
                }

                const prodi =
                    await prisma.prodi.findUnique({
                        where: {
                            id: parsedProdiId,
                        },
                        select: {
                            id: true,
                        },
                    });

                if (!prodi) {
                    throw {
                        name: "NotFound",
                        message:
                            "Program Studi tidak ditemukan",
                    };
                }
            }

            // ==========================================
            // 8. Validate Dosen
            // ==========================================
            let parsedDosenId:
                | string
                | null
                | undefined;

            if (dosenId !== undefined) {
                if (
                    dosenId === null ||
                    dosenId === ""
                ) {
                    parsedDosenId = null;
                } else {
                    parsedDosenId =
                        String(dosenId);

                    const dosen =
                        await prisma.dosen.findUnique({
                            where: {
                                id: parsedDosenId,
                            },
                            select: {
                                id: true,
                            },
                        });

                    if (!dosen) {
                        throw {
                            name: "NotFound",
                            message:
                                "Dosen tidak ditemukan",
                        };
                    }
                }
            }

            // ==========================================
            // 9. Handle Avatar
            // ==========================================
            let avatarUpdate:
                | {
                    avatarKey: string | null;
                }
                | undefined;

            if (avatarKey !== undefined) {
                // Hapus avatar
                if (
                    avatarKey === null ||
                    avatarKey === ""
                ) {
                    avatarUpdate = {
                        avatarKey: null,
                    };
                } else {
                    const newAvatarKey =
                        String(avatarKey);

                    const expectedPrefix =
                        `students/${userId}/`;

                    if (
                        !newAvatarKey.startsWith(
                            expectedPrefix
                        )
                    ) {
                        throw {
                            name: "BadRequest",
                            message:
                                "Avatar tidak valid",
                        };
                    }

                    const exists =
                        await S3Service.checkObjectExists(
                            newAvatarKey
                        );

                    if (!exists) {
                        throw {
                            name: "BadRequest",
                            message:
                                "File avatar tidak ditemukan",
                        };
                    }

                    avatarUpdate = {
                        avatarKey:
                            newAvatarKey,
                    };

                    if (
                        newAvatarKey !==
                        oldAvatarKey
                    ) {
                        newAvatarKeyForCleanup =
                            newAvatarKey;
                    }
                }
            }

            // ==========================================
            // 10. Password
            // ==========================================
            let hashedPassword:
                | string
                | undefined;

            if (
                password !== undefined &&
                password !== null &&
                password !== ""
            ) {
                hashedPassword =
                    await hashPassword(
                        password
                    );
            }

            // ==========================================
            // 11. Transaction
            // ==========================================
            const userUpdate =
                await prisma.$transaction(
                    async (tx) => {

                        // ------------------------------
                        // Update User + Mahasiswa
                        // ------------------------------
                        const updatedUser =
                            await tx.user.update({
                                where: {
                                    id: userId,
                                },

                                data: {
                                    ...(name !==
                                        undefined && {
                                        name,
                                    }),

                                    ...(email !==
                                        undefined && {
                                        email,
                                    }),

                                    ...(username !==
                                        undefined && {
                                        username,
                                    }),

                                    ...(hashedPassword !==
                                        undefined && {
                                        password:
                                            hashedPassword,
                                    }),

                                    ...(parsedBirthDate !==
                                        undefined && {
                                        birthDate:
                                            parsedBirthDate,
                                    }),

                                    ...(phoneNumber !==
                                        undefined && {
                                        phoneNumber,
                                    }),

                                    ...(gender !==
                                        undefined && {
                                        gender,
                                    }),

                                    ...(address !==
                                        undefined && {
                                        address,
                                    }),

                                    ...(nik !==
                                        undefined && {
                                        nik,
                                    }),

                                    ...(birthPlace !==
                                        undefined && {
                                        birthPlace,
                                    }),

                                    ...(avatarUpdate && {
                                        avatarKey:
                                            avatarUpdate.avatarKey,

                                        avatarUrl:
                                            null,
                                    }),

                                    mahasiswa: {
                                        update: {
                                            ...(nim !==
                                                undefined && {
                                                nim,
                                            }),

                                            ...(parsedAngkatan !==
                                                undefined && {
                                                angkatan:
                                                    parsedAngkatan,
                                            }),

                                            ...(parsedSemester !==
                                                undefined && {
                                                semester:
                                                    parsedSemester,
                                            }),

                                            ...(status !==
                                                undefined && {
                                                status,
                                            }),

                                            ...(parsedProdiId !==
                                                undefined && {
                                                prodiId:
                                                    parsedProdiId,
                                            }),

                                            ...(dosenId !==
                                                undefined && {
                                                dosenId:
                                                    parsedDosenId,
                                            }),
                                        },
                                    },
                                },

                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    avatarKey: true,

                                    mahasiswa: {
                                        select: {
                                            id: true,
                                            nim: true,
                                            angkatan: true,
                                            semester: true,
                                            status: true,
                                            prodiId: true,
                                            dosenId: true,
                                        },
                                    },
                                },
                            });

                        // ------------------------------
                        // Create status history
                        // ------------------------------
                        let statusHistory = null;

                        if (statusChanged) {
                            statusHistory =
                                await tx.riwayatStatusMahasiswa.create(
                                    {
                                        data: {
                                            mahasiswaId:
                                                mahasiswa.id,

                                            statusLama:
                                                oldStatus,

                                            statusBaru:
                                                status,

                                            alasan:
                                                parsedStatusReason!,
                                        },

                                        select: {
                                            id: true,
                                            statusLama: true,
                                            statusBaru: true,
                                            alasan: true,
                                            tanggal: true,
                                        },
                                    }
                                );
                        }

                        return {
                            updatedUser,
                            statusHistory,
                        };
                    }
                );

            // ==========================================
            // 12. DB berhasil.
            //
            // Jangan cleanup avatar baru lagi.
            // Karena sekarang avatar tersebut
            // sudah menjadi milik record database.
            // ==========================================
            newAvatarKeyForCleanup = null;

            // ==========================================
            // 13. Hapus avatar lama
            // ==========================================
            if (
                avatarUpdate &&
                oldAvatarKey &&
                oldAvatarKey !==
                avatarUpdate.avatarKey
            ) {
                try {
                    await S3Service.deleteUrl(
                        oldAvatarKey
                    );
                } catch (error) {
                    console.error(
                        "Gagal menghapus avatar lama:",
                        error
                    );
                }
            }

            // ==========================================
            // 14. Generate Presigned URL
            // ==========================================
            let avatarUrl:
                | string
                | null = null;

            if (
                userUpdate.updatedUser.avatarKey
            ) {
                avatarUrl =
                    await S3Service.createReadUrl(
                        userUpdate.updatedUser
                            .avatarKey
                    );
            }

            // ==========================================
            // 15. Response
            // ==========================================

            // console.log(status)
            return res.status(200).json({
                message:
                    "Mahasiswa berhasil diperbarui",

                data: {
                    id: userUpdate.updatedUser.id,

                    nama:
                        userUpdate.updatedUser.name,

                    email:
                        userUpdate.updatedUser.email,

                    username:
                        userUpdate.updatedUser
                            .username,

                    avatarUrl,

                    mahasiswa:
                        userUpdate.updatedUser
                            .mahasiswa,

                    statusHistory:
                        userUpdate.statusHistory,
                },
            });

        } catch (error) {
             

            // ==========================================
            // Cleanup avatar baru HANYA jika
            // transaction/update database gagal
            // ==========================================
            if (newAvatarKeyForCleanup) {
                try {
                    await S3Service.deleteUrl(
                        newAvatarKeyForCleanup
                    );
                } catch (cleanupError) {
                    console.error(
                        "Gagal cleanup avatar baru:",
                        cleanupError
                    );
                }
            }
           
            
            next(error);
        }
    }

    static async deleteUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (typeof id !== "string" || !id.trim()) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "ID user mahasiswa wajib diisi",
                });
            }

            const student = await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({
                    where: { id, role: "Mahasiswa" },
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
            });

            // Storage tidak ikut transaksi database; kegagalannya tidak membatalkan delete.
            if (student.avatarKey) {
                try {
                    await S3Service.deleteUrl(student.avatarKey);
                } catch (error) {
                    console.error("Gagal menghapus avatar mahasiswa:", error);
                }
            }

            return res.status(200).json({
                message: `${student.name} berhasil dihapus`,
            });
        } catch (error) {
            next(error);
        }
    }

    static async bulkDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const ids: unknown = req.body?.ids;
            if (
                !Array.isArray(ids) || ids.length === 0 || ids.length > 100 ||
                !ids.every((id): id is string => typeof id === "string" && id.trim().length > 0)
            ) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "ids wajib berupa array berisi 1 sampai 100 ID user mahasiswa yang valid",
                });
            }

            const userIds = [...new Set(ids.map((id) => id.trim()))];
            const students = await prisma.$transaction(async (tx) => {
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
            });

            // Cleanup hanya setelah commit, dengan concurrency terbatas.
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

            return res.status(200).json({
                message: `${students.length} mahasiswa berhasil dihapus`,
                data: { deletedCount: students.length, ids: userIds },
            });
        } catch (error) {
            next(error);
        }
    }

    // STUDENTS
    static async getAllStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";


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
                prisma.user.findMany({
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
                prisma.user.count({ where }),
            ]);

            res.status(200).json({
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
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {
            const { id } = req.params;

            const student = await prisma.user.findUnique({
                where: {
                    id: id as string,
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
                avatarUrl = await S3Service.createReadUrl(
                    student.avatarKey
                );
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
            const semester = mahasiswa.krs.reduce((latest, krs) => {
                const currentSemester =
                    (getStartYear(krs.tahunAkademik.tahun) - mahasiswa.angkatan) * 2 +
                    semesterOrder[krs.tahunAkademik.semester];
                return Math.max(latest, currentSemester);
            }, mahasiswa.semester);


            res.status(200).json({
                student: {
                    id: student.id,
                    avatarUrl,
                    nim: mahasiswa.nim,
                    nama: student.name,
                    nik: student.nik ?? null,
                    tempatLahir: student.birthPlace ?? null,
                    tanggalLahir,
                    jenisKelamin,
                    status: student.mahasiswa.status,
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
                        semester,
                        kehadiran: null,
                    },
                },
            });
        } catch (error) {
            // console.error
            next(error);
        }
    }

    static async getStudentSemesterHistory(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID yang dikirim FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User sekaligus relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
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

            // ==========================================
            // 2. Ambil seluruh KRS mahasiswa
            // ==========================================
            const krsRows = await prisma.kRS.findMany({
                where: {
                    mahasiswaId,
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
                                where: {
                                    mahasiswaId,
                                },
                                select: {
                                    bobot: true,
                                },
                            },
                        },
                    },
                },
            });

            // ==========================================
            // 3. Urutan semester
            // ==========================================
            const semesterOrder = {
                GANJIL: 1,
                GENAP: 2,
            } as const;

            // ==========================================
            // 4. Ambil tahun awal akademik
            // Contoh:
            // "2024/2025" -> 2024
            // ==========================================
            const getStartYear = (tahun: string) => {
                return Number(tahun.split("/")[0]);
            };

            // ==========================================
            // 5. Hitung semester mahasiswa
            //
            // Angkatan 2024:
            // 2024/2025 Ganjil -> 1
            // 2024/2025 Genap  -> 2
            // 2025/2026 Ganjil -> 3
            // 2025/2026 Genap  -> 4
            // ==========================================
            const getSemesterNumber = (
                tahun: string,
                semester: keyof typeof semesterOrder
            ) => {
                const startYear = getStartYear(tahun);

                return (
                    (startYear - angkatan) * 2 +
                    semesterOrder[semester]
                );
            };

            // ==========================================
            // 6. Pembulatan
            // ==========================================
            const round = (value: number) => {
                return Math.round(value * 100) / 100;
            };

            // ==========================================
            // 7. Sort KRS berdasarkan tahun + semester
            // ==========================================
            const orderedKrsRows = [...krsRows].sort((a, b) => {
                const yearA = getStartYear(
                    a.tahunAkademik.tahun
                );

                const yearB = getStartYear(
                    b.tahunAkademik.tahun
                );

                if (yearA !== yearB) {
                    return yearA - yearB;
                }

                return (
                    semesterOrder[a.tahunAkademik.semester] -
                    semesterOrder[b.tahunAkademik.semester]
                );
            });

            // ==========================================
            // 8. Variable untuk IPK kumulatif
            // ==========================================
            let cumulativeSks = 0;
            let cumulativeGradePoints = 0;

            // ==========================================
            // 9. Build riwayat semester
            // ==========================================
            const riwayatSemester = orderedKrsRows.map((krs) => {
                // Hanya mata kuliah yang sudah memiliki bobot
                const gradedDetails = krs.details.filter(
                    (detail) =>
                        detail.transkrip[0]?.bobot != null
                );

                // Total SKS semester
                const sks = gradedDetails.reduce(
                    (total, detail) => {
                        return (
                            total +
                            detail.kelasMataKuliah.mataKuliah.sks
                        );
                    },
                    0
                );

                // Total nilai berbobot
                const gradePoints = gradedDetails.reduce(
                    (total, detail) => {
                        const bobot = Number(
                            detail.transkrip[0]!.bobot
                        );

                        const sks =
                            detail.kelasMataKuliah.mataKuliah.sks;

                        return total + bobot * sks;
                    },
                    0
                );

                // ==========================================
                // Update nilai kumulatif
                // ==========================================
                cumulativeSks += sks;
                cumulativeGradePoints += gradePoints;

                // ==========================================
                // IPS
                // ==========================================
                const ips =
                    sks > 0
                        ? round(gradePoints / sks)
                        : 0;

                // ==========================================
                // IPK
                // ==========================================
                const ipk =
                    cumulativeSks > 0
                        ? round(
                            cumulativeGradePoints /
                            cumulativeSks
                        )
                        : 0;

                // ==========================================
                // Label semester
                // ==========================================
                const labelSemester =
                    krs.tahunAkademik.semester === "GANJIL"
                        ? "Ganjil"
                        : "Genap";

                return {
                    semester: getSemesterNumber(
                        krs.tahunAkademik.tahun,
                        krs.tahunAkademik.semester
                    ),

                    tahunAkademik: {
                        id: krs.tahunAkademik.id,
                        tahun: krs.tahunAkademik.tahun,
                        semester: krs.tahunAkademik.semester,
                        label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                    },

                    sks,

                    ips,

                    ipk,

                    status:
                        krs.status === "DISETUJUI"
                            ? "SELESAI"
                            : krs.status,
                };
            });

            // console.log(riwayatSemester, "<< RIWAYAT SEMESTER");
            return res.status(200).json({
                riwayatSemester,
            });
        } catch (error) {
            console.error(error);
            next(error);
        }
    }

    static async getStudentKRS(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID dari FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User dan relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (
                !user ||
                user.role !== "Mahasiswa" ||
                !user.mahasiswa
            ) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswaId = user.mahasiswa.id;

            // ==========================================
            // 2. Validate tahunAkademikId
            // ==========================================
            const tahunAkademikIdParam =
                req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw {
                    name: "BadRequest",
                    message: "tahunAkademikId wajib diisi",
                };
            }

            const tahunAkademikId =
                Number(tahunAkademikIdParam);

            if (
                !Number.isInteger(tahunAkademikId) ||
                tahunAkademikId <= 0
            ) {
                throw {
                    name: "BadRequest",
                    message:
                        "tahunAkademikId harus berupa angka positif",
                };
            }

            // ==========================================
            // 3. Ambil KRS
            // ==========================================
            const krs = await prisma.kRS.findUnique({
                where: {
                    mahasiswaId_tahunAkademikId: {
                        mahasiswaId,
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

            // ==========================================
            // 4. KRS belum tersedia
            // ==========================================
            if (!krs) {
                return res.status(200).json({
                    krs: null,
                });
            }

            // ==========================================
            // 5. Label semester
            // ==========================================
            const labelSemester =
                krs.tahunAkademik.semester === "GANJIL"
                    ? "Ganjil"
                    : "Genap";

            // ==========================================
            // 6. Mapping details
            // ==========================================
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

            // ==========================================
            // 7. Total SKS
            // ==========================================
            const totalSKS = details.reduce(
                (total, detail) =>
                    total + detail.mataKuliah.sks,
                0
            );

            // ==========================================
            // 8. Response
            // ==========================================

            return res.status(200).json({
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
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentNilai(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID dari FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User dan relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (
                !user ||
                user.role !== "Mahasiswa" ||
                !user.mahasiswa
            ) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswaId = user.mahasiswa.id;

            // ==========================================
            // 2. Validate tahunAkademikId
            // ==========================================
            const tahunAkademikIdParam =
                req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw {
                    name: "BadRequest",
                    message: "tahunAkademikId wajib diisi",
                };
            }

            const tahunAkademikId =
                Number(tahunAkademikIdParam);

            if (
                !Number.isInteger(tahunAkademikId) ||
                tahunAkademikId <= 0
            ) {
                throw {
                    name: "BadRequest",
                    message:
                        "tahunAkademikId harus berupa angka positif",
                };
            }

            // ==========================================
            // 3. Get KRS semester yang dipilih
            //    + seluruh KRS untuk IPK
            // ==========================================
            const [krs, allKrs] = await Promise.all([
                prisma.kRS.findUnique({
                    where: {
                        mahasiswaId_tahunAkademikId: {
                            mahasiswaId,
                            tahunAkademikId,
                        },
                    },

                    select: {
                        id: true,

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
                                                id: true,
                                                kode: true,
                                                nama: true,
                                                sks: true,
                                            },
                                        },
                                    },
                                },

                                transkrip: {
                                    where: {
                                        mahasiswaId,
                                    },
                                    select: {
                                        nilaiAngka: true,
                                        nilaiHuruf: true,
                                        bobot: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                prisma.kRS.findMany({
                    where: {
                        mahasiswaId,
                    },

                    select: {
                        tahunAkademikId: true,

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
                                    where: {
                                        mahasiswaId,
                                    },
                                    select: {
                                        bobot: true,
                                    },
                                },
                            },
                        },
                    },
                }),
            ]);

            // ==========================================
            // 4. KRS belum tersedia
            // ==========================================
            if (!krs) {
                return res.status(200).json({
                    nilai: null,
                });
            }

            // ==========================================
            // 5. Hanya nilai yang sudah mempunyai bobot
            // ==========================================
            const gradedDetails = krs.details.filter(
                (detail) =>
                    detail.transkrip[0]?.bobot != null
            );

            // ==========================================
            // 6. Mapping nilai
            // ==========================================
            const details = gradedDetails.map((detail) => {
                const transkrip = detail.transkrip[0]!;

                return {
                    id: detail.id,

                    mataKuliah: {
                        id: detail.kelasMataKuliah.mataKuliah.id,
                        kode: detail.kelasMataKuliah.mataKuliah.kode,
                        nama: detail.kelasMataKuliah.mataKuliah.nama,
                        sks: detail.kelasMataKuliah.mataKuliah.sks,
                    },

                    nilai:
                        transkrip.nilaiAngka != null
                            ? Number(transkrip.nilaiAngka)
                            : null,

                    grade: transkrip.nilaiHuruf,

                    bobot:
                        transkrip.bobot != null
                            ? Number(transkrip.bobot)
                            : null,
                };
            });

            // ==========================================
            // 7. Calculate SKS + Grade Points
            // ==========================================
            const calculatePoints = (
                rows: typeof allKrs
            ) => {
                return rows.reduce(
                    (summary, row) => {
                        row.details.forEach((detail) => {
                            const transkrip =
                                detail.transkrip[0];

                            if (transkrip?.bobot == null) {
                                return;
                            }

                            const sks =
                                detail
                                    .kelasMataKuliah
                                    .mataKuliah
                                    .sks;

                            const bobot =
                                Number(transkrip.bobot);

                            summary.sks += sks;
                            summary.points +=
                                bobot * sks;
                        });

                        return summary;
                    },
                    {
                        sks: 0,
                        points: 0,
                    }
                );
            };

            // ==========================================
            // 8. IPS semester yang dipilih
            // ==========================================
            const currentSummary =
                calculatePoints(
                    allKrs.filter(
                        (row) =>
                            row.tahunAkademikId ===
                            tahunAkademikId
                    )
                );

            // ==========================================
            // 9. IPK kumulatif
            // ==========================================
            const cumulativeSummary =
                calculatePoints(allKrs);

            // ==========================================
            // 10. Helper pembulatan
            // ==========================================
            const round = (value: number) =>
                Math.round(value * 100) / 100;

            // ==========================================
            // 11. Label semester
            // ==========================================
            const labelSemester =
                krs.tahunAkademik.semester === "GANJIL"
                    ? "Ganjil"
                    : "Genap";

            // ==========================================
            // 12. Response
            // ==========================================
            return res.status(200).json({
                nilai: {
                    tahunAkademik: {
                        id: krs.tahunAkademik.id,
                        tahun: krs.tahunAkademik.tahun,
                        semester: krs.tahunAkademik.semester,
                        label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                    },

                    details,

                    summary: {
                        totalSKS: currentSummary.sks,

                        ips:
                            currentSummary.sks > 0
                                ? round(
                                    currentSummary.points /
                                    currentSummary.sks
                                )
                                : 0,

                        ipk:
                            cumulativeSummary.sks > 0
                                ? round(
                                    cumulativeSummary.points /
                                    cumulativeSummary.sks
                                )
                                : 0,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const userId = String(req.params.userId)
            const { password } = req.body

            if (!password || typeof password !== "string") {
                throw {
                    name: "BadRequest",
                    message: "Password baru wajib diisi",
                }
            }

            if (password.length < 8) {
                throw {
                    name: "BadRequest",
                    message: "Password minimal 8 karakter",
                }
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    name: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                            nim: true,
                        },
                    },
                },
            })

            if (!user || !user.mahasiswa) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                }
            }

            const hashedPassword = await hashPassword(password)

            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    password: hashedPassword,
                    mustChangePassword: true,
                },
            })

            return res.status(200).json({
                message: "Password mahasiswa berhasil direset",
                data: {
                    id: user.id,
                    name: user.name,
                    nim: user.mahasiswa.nim,
                    mustChangePassword: true,
                },
            })
        } catch (error) {
            next(error)
        }
    }
}
