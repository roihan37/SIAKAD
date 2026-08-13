import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { JabatanDosen, Prisma } from "@prisma/client";


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

    static async getAllProdi(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 10);
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
            const fakultasId = Number(req.query.fakultasId);

            const where: Prisma.ProdiWhereInput = {
                ...(fakultasId ? { fakultasId } : {}),
                ...(search
                    ? {
                        OR: [
                            { kode: { contains: search, mode: Prisma.QueryMode.insensitive } },
                            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        ],
                    }
                    : {}),
            };

            const sortableFields: Record<string, Prisma.ProdiOrderByWithRelationInput> = {
                kode: { kode: sortOrder },
                name: { name: sortOrder },
                fakultas: { fakultas: { name: sortOrder } },
            };
            const orderBy = sortableFields[sortBy] ?? { name: sortOrder };

            const [prodi, totalRows] = await Promise.all([
                prisma.prodi.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy,
                    select: {
                        id: true,
                        kode: true,
                        name: true,
                        fakultas: { select: { name: true } },
                        dosen: {
                            select: { user: { select: { name: true } } },
                            where: { jabatan: JabatanDosen.Kaprodi },
                        },
                    },
                }),
                prisma.prodi.count({ where }),
            ]);

            const result = prodi.map((el) => ({
                id: el.id,
                kode: el.kode,
                name: el.name,
                fakultas: el.fakultas.name,
                kaprodi: el.dosen[0]?.user.name ?? "-",
            }));
            
            res.status(200).json({
                prodi: result,
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
