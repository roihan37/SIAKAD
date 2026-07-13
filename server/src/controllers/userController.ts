import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";

export class Controller {
    static async addUser(req: Request, res: Response) {
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

            const newUser = await prisma.user.create({
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
                await prisma.mahasiswa.create({
                    data: {
                        nim,
                        angkatan,
                        semester,
                        status,
                        prodiId,
                        dosenId,
                        userId: newUser.id
                    }
                })
            }

            if (role === "Dosen") {
                await prisma.dosen.create({
                    data: {
                        nidn,
                        jabatan,
                        status,
                        prodiId,
                        userId: newUser.id
                    }
                })
            }

            res.status(201).json({
                message: `${newUser.name} created successfully`
            })

        } catch (error) {
            res.status(500).json({ message: error });
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

