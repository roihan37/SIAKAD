import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { Prisma } from "@prisma/client";
import { AvatarService } from "../services/avatar.service";
import { S3Service } from "../services/s3.service";
import { resourceId, text } from "../validation/master-data";
import { attendanceCounts, percentage } from "../services/attendance.service";
import { getStudentFinance, listStudentTuitionBills } from "../services/tuition.service";
import { StudentFinanceService } from "../services/student-finance.service";
import { StudentAccountService } from "../services/student-account.service";
import { StudentManagementService } from "../services/student-management.service";
import { StudentAttendanceService } from "../services/student-attendance.service";
import { StudentAcademicService } from "../services/student-academic.service";


export class Controller {

    static async getFinanceyId(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = req.query.tahunAkademikId === undefined ? undefined : resourceId(req.query.tahunAkademikId);
            const now = new Date();
            const data = await prisma.$transaction(
                (tx) => StudentFinanceService.getFinance(tx, userId, tahunAkademikId, now),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
            return res.status(200).json({ message: "Student financial data retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getUKTById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const now = new Date();
            const data = await prisma.$transaction(
                (tx) => StudentFinanceService.getUKTBills(tx, userId, now),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
            return res.status(200).json({ message: "Tuition bills retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getMyUKT(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userLogin) throw { name: "TokenInvalid" };
            if (req.userLogin.role !== "Mahasiswa") throw { name: "Forbidden", message: "Akses hanya untuk mahasiswa." };
            const userId = req.userLogin.id;
            const now = new Date();
            const data = await prisma.$transaction(
                (tx) => StudentFinanceService.getMyUKT(tx, userId, now),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
            return res.status(200).json({ message: "Tuition bills retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = resourceId(req.query.tahunAkademikId);
            const data = await prisma.$transaction(
                (tx) => StudentAttendanceService.getStudentAttendance(tx, userId, tahunAkademikId),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
            return res.status(200).json({ message: "Student attendance retrieved successfully", data });
        } catch (error) { next(error); }
    }

    static async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { ids, status, statusReason } = req.body;
            const data = await StudentManagementService.bulkUpdateStatus(ids, status, statusReason);
            return res.status(200).json({ message: `${data.changedCount} mahasiswa berhasil diperbarui`, data });
        } catch (error) { next(error); }
    }

    static async createStudent(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        let created = false;
        try {
            const result = await StudentManagementService.createStudent(req.body);
            created = true;
            res.status(201).json({
                message: `${result.name} created successfully`
            });
        } catch (error) {
            // Preserve legacy cleanup even if sending the response fails after commit.
            if (created) await StudentManagementService.cleanupCreateAvatar(req.body.avatarKey);
            next(error);
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
                                        refreshTokens: { updateMany: { where: {}, data: { revoked: true } } },
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

            const student = await StudentManagementService.deleteUserById(id);

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
            const students = await StudentManagementService.bulkDelete(userIds);

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
            const data = await StudentManagementService.getAllStudents(prisma, page, limit, search, sortBy, sortOrder);
            return res.status(200).json(data);
        } catch (error) { next(error); }
    }

    static async getStudentById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { id } = req.params;
            const data = await StudentManagementService.getStudentById(prisma, id as string);
            return res.status(200).json({ student: data });
        } catch (error) {
            next(error);
        }
    }
    static async getStudentSemesterHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const result = await StudentAcademicService.getStudentSemesterHistory(prisma, userId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    static async getStudentKRS(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const tahunAkademikIdParam = req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw { name: "BadRequest", message: "tahunAkademikId wajib diisi" };
            }

            const tahunAkademikId = Number(tahunAkademikIdParam);
            if (!Number.isInteger(tahunAkademikId) || tahunAkademikId <= 0) {
                throw { name: "BadRequest", message: "tahunAkademikId harus berupa angka positif" };
            }

            const result = await StudentAcademicService.getStudentKRS(prisma, userId, tahunAkademikId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    static async getStudentNilai(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = req.query.tahunAkademikId === undefined ? undefined : resourceId(req.query.tahunAkademikId);
            if (tahunAkademikId === undefined) {
                throw { name: "BadRequest", message: "tahunAkademikId wajib diisi" };
            }

            const result = await prisma.$transaction(
                (tx) => StudentAcademicService.getStudentNilai(tx, userId, tahunAkademikId),
                { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
            );
            return res.status(200).json(result);
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
            const userId = String(req.params.userId);
            const { password } = req.body;

            // Validation is now handled by the service for consistency
            const result = await prisma.$transaction(
                (tx) => StudentAccountService.resetPassword(tx, userId, password),
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            );

            return res.status(200).json({
                message: "Password mahasiswa berhasil direset",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
