import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";


export class Controller{

    static async createFakultas(req: Request, res: Response, next: NextFunction){
        try {
            const {
                kode,
                name,
            } = req.body

            const newFakultas = await prisma.fakultas.create({
                data : {
                    kode,
                    name
                }
            })
            res.status(200).json({message: "fakultas berhasil dibuat",newFakultas})
        } catch (error) {
            next(error)
        }
    }

    static async updateFakultas(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const {
                kode,
                name,
            } = req.body

            const newFakultas = await prisma.fakultas.update({
                where : {id : Number(id)},
                data : {
                    kode,
                    name
                }
            })
            res.status(200).json({
                message: "Fakultas berhasil diperbarui",
                newFakultas
            })
        } catch (error) {
            next(error)
        }
    }

    static async getAllFakultas(req: Request, res: Response, next: NextFunction){
        try {

            const fakultas = await prisma.fakultas.findMany({
                select : {
                    id : true,
                    kode : true,
                    name : true,
                    prodi : {
                        select : {
                            dosen : {
                                where : {
                                    jabatan : 'Dekan'
                                },
                                select : {
                                    user : {
                                        select : {
                                            name : true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            const result = fakultas.map((fk)=>({
                id : fk?.id,
                kode : fk?.kode,
                name : fk?.name,
                dekan : fk.prodi
                .flatMap((p) => p.dosen)[0]
                ?.user.name ?? "-"
            }))
            
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }

    static async getFakultasById(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const fakultas = await prisma.fakultas.findUnique({
                where : {id : Number(id)}
            })
            if(!fakultas){
                throw { name : 'NotFound'}
            }
            res.status(200).json(fakultas)
        } catch (error) {
            next(error)
        }
    }

    static async deleteFakultasById(req: Request, res: Response, next: NextFunction){
        try {
            const {id} = req.params
            const fakultas = await prisma.fakultas.findUnique({where:{id:Number(id)}})
            if(!fakultas){throw {name: "NotFound"}}
            await prisma.fakultas.delete({where:{id:Number(id)}})

            res.status(200).json({message : `${fakultas.name} sudah dihapus`})
        } catch (error) {
            next(error)
        }
    }

}