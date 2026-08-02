import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { SelectUser } from "../types/user";

export class Controller {
    // USERS
    static async addUser(
        req: Request,
        res: Response,
        next: NextFunction
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

    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const user = await prisma.user.findUnique({
                where: { id: id as string },
                select: {
                    role: true
                }
            })

            if (!user) {
                throw { name: "NotFound" }
            }

            let select: SelectUser = {
                id: true,
                name: true,
                email: true,
                role: true,
                gender: true,
            }

            switch (user?.role) {
                case "Mahasiswa":
                    select.mahasiswa = {
                        select: {
                            id: true,
                            nim: true,
                            status: true,
                        },
                    }
                    break;
                case "Dosen":
                    select.dosen = {
                        select: {
                            id: true,
                            nidn: true,
                            status: true,
                            jabatan: true
                        }
                    }
                default:
                    return res.status(400).json({
                        message: "Role tidak dikenali",
                    });

            }

            const result = await prisma.user.findUnique({
                where: { id: id as string },
                select
            })

            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }

    static async updateUserById(req: Request, res: Response, next : NextFunction) {
        try {
            const {id} = req.params
            
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

            const user = await prisma.user.findUnique({
                where : { id: id as string },
            })

            if(!user){
                throw { name : "NotFound"}
            }

            const hash = await hashPassword(password)

            const userUpdate = await prisma.$transaction(async (tx) => {
                const user = await prisma.user.update({
                    where : {id : id as string},
                    data: {
                        name,
                        email,
                        username,
                        password : hash,
                        birthDate,
                        role,
                        phoneNumber,
                        gender,
                        address,
                    }
                })
                if (role === "Mahasiswa") {
                    await tx.mahasiswa.update({
                        where : {userId: user.id},
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
                    await tx.dosen.update({
                        where : {userId: user.id},
                        data: {
                            nidn,
                            jabatan,
                            status,
                            prodiId,
                        }
                    })
                }
                return user
            })

            res.status(200).json({
                message: "User berhasil diperbarui",
                data: userUpdate.id,
            });
        } catch (error) {
            next(error)
        }
    }

    static async deleteUserById(req: Request, res: Response, next : NextFunction){
        try {
            
        } catch (error) {
            
        }
    }

    // STUDENTS
    // BELUM PAGINATION
    static async getAllStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const allStudents = await prisma.user.findMany(
                {
                    where: {
                        role: "Mahasiswa"
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        gender: true,
                        mahasiswa: {
                            select: {
                                id: true,
                                nim: true,
                                status: true,
                            }
                        }
                    }
                }
            )
            res.status(200).json(allStudents)

        } catch (error) {
            next(error)
        }
    }

    static async getStudentById(req: Request, res : Response, next : NextFunction) {
        try {
            const { id } = req.params

            const student = await prisma.user.findUnique({
                where : {
                    id : id as string,
                    role : 'Mahasiswa'
                }
            })

            if(!student){
                throw { name : 'NotFound'}
            }

            res.status(200).json(student)
        } catch (error) {
            next(error)
        }
    }
    
    
    // LECTURER
    // BELUM PAGINATION
    static async getAllLecturers(req: Request, res: Response, next: NextFunction) {
        try {
            const allLecturers = await prisma.user.findMany(
                {
                    where: {
                        role: "Dosen"
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        gender: true,
                        dosen: {
                            select: {
                                id: true,
                                nidn: true,
                                status: true,
                                jabatan: true
                            }
                        }
                    }
                }
            )
            res.status(200).json(allLecturers)

        } catch (error) {
            next(error)
        }
    }

    static async getAllLecturerById(req: Request, res : Response, next : NextFunction) {
        try {
            const {id} = req.params

            const lecturer = await prisma.user.findUnique({
                where : {
                    id : id as string,
                    role : 'Dosen'
                }
            })

            if(!lecturer){
                throw {name : 'NotFound'}
            }

            res.status(200).json(lecturer)
        } catch (error) {
            next(error)
        }
    }

}

