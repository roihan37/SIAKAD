import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { Prisma } from "@prisma/client";

export class Controller {
    static async addUser(
        req: Request, 
        res: Response, 
        next : NextFunction
        ) {
        try {
            const {
                name,
                email,
                username,
                password,
                role,
                phoneNumber,
                gender,
                address,
                nim,
                angkatan,
                semester,
                status,
                prodiId,
                dosenId,
                nidn,
                jabatan,
                birthDate
            } = req.body

            const hash = await hashPassword(password)

            const newUser = await prisma.$transaction(async (tx) => {
                const user = await prisma.user.create({
                    data: {
                        name,
                        email,
                        username,
                        password: hash,
                        birthDate,
                        role,
                        phoneNumber,
                        gender,
                        address,
                    }
                })

                if (role === "Mahasiswa") {
                    await tx.mahasiswa.create({
                        data: {
                            nim,
                            angkatan,
                            semester,
                            status,
                            prodiId,
                            userId: user.id
                        }
                    })
                }

                if (role === "Dosen") {
                    await tx.dosen.create({
                        data: {
                            nidn,
                            jabatan,
                            status,
                            prodiId,
                            userId: user.id
                        }
                    })
                }

                return user
            })
            res.status(201).json({
                message: `${newUser.name} created successfully`
            })

        } catch (error) {
            next(error)
        }
    }

    static async getAllStudents(req: Request, res: Response) {
        try {
            const allStudents = await prisma.user.findMany()
            console.log(allStudents);

        } catch (error) {

        }
    }

}

