import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { JabatanDosen, Prisma } from "@prisma/client";


export class Controller {

    static async createFakultas(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                kode,
                name,
            } = req.body

            const newFakultas = await prisma.fakultas.create({
                data: {
                    kode,
                    name
                }
            })
            res.status(200).json({ message: "fakultas berhasil dibuat", newFakultas })
        } catch (error) {
            next(error)
        }
    }

    static async updateFakultas(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const {
                kode,
                name,
            } = req.body

            const newFakultas = await prisma.fakultas.update({
                where: { id: Number(id) },
                data: {
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

    static async getAllFakultas(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    
            const skip = (page - 1) * limit;
    
            // search di kode ATAU name — sesuai model Fakultas, bukan User
            const where: Prisma.FakultasWhereInput = search
                ? {
                      OR: [
                          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { kode: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {};
    
            // whitelist kolom yang boleh di-sort — cegah orang kirim sortBy sembarangan
            const sortableFields: Record<string, Prisma.FakultasOrderByWithRelationInput> = {
                name: { name: sortOrder },
                kode: { kode: sortOrder },
            };
    
            const orderBy = sortableFields[sortBy] ?? { name: sortOrder };
    
            const [fakultas, totalRows] = await Promise.all([
                prisma.fakultas.findMany({
                    where,
                    orderBy,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        kode: true,
                        name: true,
                        prodi: {
                            select: {
                                dosen: {
                                    where: { jabatan: JabatanDosen.Dekan },
                                    select: {
                                        user: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                }),
                prisma.fakultas.count({ where }),
            ]);
    
            const result = fakultas.map((fk) => ({
                id: fk.id,
                kode: fk.kode,
                name: fk.name,
                dekan: fk.prodi.flatMap((p) => p.dosen)[0]?.user.name ?? "-",
            }));
            
            res.status(200).json({
                fakultas: result,
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

    static async getFakultasById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const fakultas = await prisma.fakultas.findUnique({
                where: { id: Number(id) }
            })
            if (!fakultas) {
                throw { name: 'NotFound' }
            }
            res.status(200).json(fakultas)
        } catch (error) {
            next(error)
        }
    }

    static async deleteFakultasById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const fakultas = await prisma.fakultas.findUnique({ where: { id: Number(id) } })
            if (!fakultas) { throw { name: "NotFound" } }
            await prisma.fakultas.delete({ where: { id: Number(id) } })

            res.status(200).json({ message: `${fakultas.name} sudah dihapus` })
        } catch (error) {
            next(error)
        }
    }

}