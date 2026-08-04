import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";


export class Controller{

    static async createProdi(req: Request, res: Response, next: NextFunction){
        try {
            const {
                kode,
                name,
                fakultasId
            } = req.body

            const newProdi = await prisma.prodi.create({
                data : {
                    kode,
                    name,
                    fakultasId
                }
            })
            res.status(200).json({message: "prodi berhasil dibuat",newProdi})
        } catch (error) {
            next(error)
        }
    }

    static async updateProdi(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const {
                kode,
                name,
                fakultasId
            } = req.body

            const updateProdi = await prisma.prodi.update({
                where : {id : Number(id)},
                data : {
                    kode,
                    name,
                    fakultasId
                }
            })
            res.status(200).json({
                message: "prodi berhasil diperbarui",
                updateProdi
            })
        } catch (error) {
            next(error)
        }
    }

    static async getAllProdi(req: Request, res: Response, next: NextFunction){
        try {
            const prodi = await prisma.prodi.findMany({
                select : {
                    id : true,
                    kode : true,
                    name : true,
                    fakultas : {
                        select : {
                            name : true
                        }
                    },
                    dosen : {
                        select : {
                            user : {
                                select : {
                                    name : true
                                }
                            }
                        },
                        where : {
                            jabatan : 'Kaprodi'
                        }
                    }
                }
            })

            const result = prodi.map((el)=>({
                id : el.id,
                kode : el.kode,
                name : el.name,
                fakultas : el.fakultas.name,
                kaprodi : el.dosen[0]?.user.name ?? "-"
            }))

            console.log(result);
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }

    static async getProdiById(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const prodi = await prisma.prodi.findUnique({
                where : {id : Number(id)}
            })
            if(!prodi){
                throw { name : 'NotFound'}
            }
            res.status(200).json(prodi)
        } catch (error) {
            next(error)
        }
    }

    static async deleteProdiById(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const prodi = await prisma.prodi.findUnique({where:{id:Number(id)}})
            if(!prodi){throw {name: "NotFound"}}
            await prisma.prodi.delete({where:{id:Number(id)}})

            res.status(200).json({message : `${prodi.name} sudah dihapus`})
        } catch (error) {
            next(error)
        }
    }

}