import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";

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

    static async getAllStudents(req: Request, res: Response, next : NextFunction) {
        try {
                const allStudents = await prisma.user.findMany(
                    {
                        where : {
                            role : "Mahasiswa"
                        },
                        select : {
                            id : true,
                            name : true,
                            email : true,
                            role : true,
                            gender : true,
                            mahasiswa : {
                                select : {
                                    id : true,
                                    nim : true,
                                    status : true,                
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

    static async getStudentById(req: Request, res: Response, next : NextFunction){
        try {
            const { id } = req.params

            const studentById = await prisma.user.findUnique({
                where : { id : id as string }
            })

            if(!studentById){
                throw { name : "NotFound"}
            }
        } catch (error) {
            next(error)
        }
    }

    static async getAllLecturers(req: Request, res: Response, next : NextFunction) {
        try {
            const allLecturers = await prisma.user.findMany(
                {
                    where : {
                        role : "Dosen"
                    },
                    select : {
                        id : true,
                        name : true,
                        email : true,
                        role : true,
                        gender : true,
                        dosen : {
                            select : {
                                id : true,
                                nidn : true,
                                status : true,
                                jabatan : true
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

}

