import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { hashPassword } from "../lib/bycript";
import { prisma } from "../lib/prisma";
import { S3Service } from "../services/s3.service";
import { AvatarService } from "../services/avatar.service";

export class Controller {
    static async createLecturer(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                name, email, username, password, phoneNumber, gender, address,
                nidn, status, jabatan, prodiId, birthDate, avatarKey,
            } = req.body;

            let avatarUrl: string | undefined;
            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
            }

            const lecturer = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name,
                        email,
                        username,
                        password: hashPassword(password),
                        birthDate,
                        role: "Dosen",
                        phoneNumber,
                        gender,
                        address,
                        avatarKey,
                        avatarUrl,
                    },
                });

                await tx.dosen.create({
                    data: { nidn, status, jabatan, prodiId: Number(prodiId), userId: user.id },
                });

                return user;
            });

            res.status(201).json({ message: `${lecturer.name} created successfully`, data: lecturer.id });
        } catch (error) {
            next(error);
        }
    }

    static async updateLecturerById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const {
                name, email, username, password, phoneNumber, gender, address,
                nidn, status, jabatan, prodiId, birthDate, avatarKey,
            } = req.body;

            const existingUser = await prisma.user.findUnique({
                where: { id },
                include: { dosen: true },
            });
            if (!existingUser) throw { name: "NotFound", message: "User tidak ditemukan" };
            if (!existingUser.dosen) throw { name: "BadRequest", message: "User ini bukan dosen" };

            let avatarUrl: string | undefined;
            let oldAvatarKey: string | null = null;
            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
                oldAvatarKey = existingUser.avatarKey;
            }

            const lecturer = await prisma.user.update({
                where: { id },
                data: {
                    name,
                    email,
                    username,
                    password: password ? hashPassword(password) : existingUser.password,
                    birthDate,
                    phoneNumber,
                    gender,
                    address,
                    ...(avatarKey ? { avatarKey, avatarUrl } : {}),
                    dosen: {
                        update: {
                            nidn,
                            status,
                            jabatan,
                            prodiId: prodiId === undefined ? undefined : Number(prodiId),
                        },
                    },
                },
                include: { dosen: true },
            });

            if (oldAvatarKey && oldAvatarKey !== avatarKey) await S3Service.deleteUrl(oldAvatarKey);

            res.status(200).json({ message: "Dosen berhasil diperbarui", data: lecturer.id });
        } catch (error) {
            next(error);
        }
    }

    static async deleteLecturerById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const lecturer = await prisma.user.findFirst({ where: { id, role: "Dosen" } });
            if (!lecturer) throw { name: "NotFound", message: "Dosen tidak ditemukan" };

            await prisma.user.delete({ where: { id } });
            if (lecturer.avatarKey) await S3Service.deleteUrl(lecturer.avatarKey);

            res.status(200).json({ message: `${lecturer.name} berhasil dihapus` });
        } catch (error) {
            next(error);
        }
    }

    static async getAllLecturers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 10);
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
            const prodiId = Number(req.query.prodiId);

            const where: Prisma.UserWhereInput = {
                role: "Dosen",
                ...(prodiId ? { dosen: { prodiId } } : {}),
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        { dosen: { nidn: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                    ],
                } : {}),
            };
            const sortableFields: Record<string, Prisma.UserOrderByWithRelationInput> = {
                name: { name: sortOrder },
                nidn: { dosen: { nidn: sortOrder } },
                jabatan: { dosen: { jabatan: sortOrder } },
            };

            const [lecturers, totalRows] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: sortableFields[sortBy] ?? { name: sortOrder },
                    select: {
                        id: true, name: true, email: true, username: true, role: true, avatarUrl: true,
                        dosen: {
                            select: {
                                id: true, nidn: true, status: true, jabatan: true,
                                prodi: { select: { id: true, name: true } },
                            },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            res.status(200).json({
                lecturers,
                pagination: { page, limit, totalRows, totalPages: Math.max(1, Math.ceil(totalRows / limit)) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getLecturerById(req: Request, res: Response, next: NextFunction) {
        try {
            const lecturer = await prisma.user.findFirst({
                where: { id: String(req.params.id), role: "Dosen" },
                include: { dosen: { include: { prodi: true } } },
            });
            if (!lecturer) throw { name: "NotFound", message: "Dosen tidak ditemukan" };

            res.status(200).json(lecturer);
        } catch (error) {
            next(error);
        }
    }

}
