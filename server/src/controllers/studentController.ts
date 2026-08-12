import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../lib/bycript";
import { SelectUser } from "../types/user";
import { Prisma } from "@prisma/client";
import { StudentService } from "../services/student.service";
import { s3 } from "../config/s3";
import { S3Service } from "../services/s3.service";

export class Controller {

    static async createStudent(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const {
                name, email, username, password, phoneNumber, gender, address,
                nim, angkatan, semester, status, prodiId, birthDate, avatarKey, dosenId
            } = req.body

            console.log(req.body);
            const hash = await hashPassword(password)
            let avatarUrl: string | undefined;

            if (avatarKey) {
                const exists = await S3Service.checkObjectExists(avatarKey);
                if (!exists) {
                    throw { name: "BadRequest", message: "File avatar tidak ditemukan. Silakan upload ulang." };
                }
                avatarUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${avatarKey}`;
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

            console.log(newUser, '<< NEW USERS');
            
            res.status(201).json({
                message: `${newUser.name} created successfully`
            })

        } catch (error) {
            next(error)
        }
    }

    static async updateStudentById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const {
                name,
                email,
                username,
                password,
                phoneNumber,
                gender,
                address,
                nim,
                angkatan,
                semester,
                status,
                prodiId,
                birthDate,
                avatarKey
            } = req.body

            

            const existingUser = await prisma.user.findUnique({
                where: { id: id as string },
                include: { mahasiswa: true },
            });

            if (!existingUser) throw { name: "NotFound", message: "User tidak ditemukan" };
            if (!existingUser.mahasiswa) throw { name: "BadRequest", message: "User ini bukan mahasiswa" };

            let avatarUrl: string | undefined;
            let oldAvatarKey: string | null = null;

            if (avatarKey) {
                const exists = await S3Service.checkObjectExists(avatarKey);
                if (!exists) {
                    throw { name: "BadRequest", message: "File avatar tidak ditemukan. Silakan upload ulang." };
                }
                avatarUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${avatarKey}`;
                oldAvatarKey = existingUser.avatarKey; // simpan referensi foto lama untuk dihapus setelah update sukses
            }

            const hash = password ? await hashPassword(password) : existingUser.password;

            const userUpdate = await prisma.user.update({
                where: { id: id as string },
                data: {
                    name,
                    email,
                    username,
                    password: hash,
                    birthDate,
                    phoneNumber,
                    gender,
                    address,
                    ...(avatarKey ? { avatarKey, avatarUrl } : {}),
                    mahasiswa: {
                        update: {
                            nim,
                            angkatan,
                            semester,
                            status,
                            prodiId,
                        },
                    },
                },
                include: {
                    mahasiswa: true, // opsional: biar response langsung bawa data mahasiswa terbaru
                },
            });

            if (oldAvatarKey) {
                await S3Service.deleteUrl(oldAvatarKey)
            }

            res.status(200).json({
                message: "User berhasil diperbarui",
                data: userUpdate.id,
            });
        } catch (error) {
            next(error)
        }
    }

    static async deleteUserById(req: Request, res: Response, next: NextFunction) {
        try {

        } catch (error) {

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
                students,
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

    static async getStudentById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const student = await prisma.user.findFirst({
                where: {
                    id: id as string,
                    role: "Mahasiswa",
                },
                include: {
                    mahasiswa: {
                        include: { prodi: true },
                    },
                },
            });

            if (!student) {
                throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
            }

            res.status(200).json(student);
        } catch (error) {
            next(error);
        }
    }

    static async createAvatarUpload(req: Request, res: Response, next: NextFunction) {
        try {
            // const {id} = req.params
            const { contentType } = req.body;

            const result = await StudentService.createAvatarUpload(contentType)
            res.status(201).json(result);
        } catch (error) {
            next(error)
        }
    }

    static async createAvatarUploadForEdit(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { contentType } = req.body;
            const result = await StudentService.createAvatarUploadForEdit(id as string, contentType);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }



}

