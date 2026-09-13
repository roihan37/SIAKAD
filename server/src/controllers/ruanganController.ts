import { resourceId, patchBody, ensureUnused, ruanganPatch } from "../validation/master-data";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createRuangan(req: Request, res: Response, next: NextFunction) {
    try {
      const { kode, nama, kapasitas, gedung } = req.body;
      const r = await prisma.ruangan.create({ data: { kode, nama, kapasitas: Number(kapasitas), gedung } });
      res.status(200).json({ message: "Ruangan created", r });
    } catch (error) {
      next(error);
    }
  }

  static async updateRuangan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      const data = patchBody(req.body, ruanganPatch);
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.ruangan.findUnique({ where: { id } });
        if (!existing) throw { name: "NotFound", message: "Ruangan tidak ditemukan." };
        return tx.ruangan.update({ where: { id }, data });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Ruangan berhasil diperbarui", data: updated, r: updated });
    } catch (error) { next(error); }
  }

  static async getAllRuangan(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const search = String(req.query.search ?? "")

    const sortOrder =
      req.query.sortOrder === "asc"
        ? "asc"
        : "desc"

    const skip = (page - 1) * limit

    const where: Prisma.RuanganWhereInput = search
      ? {
          OR: [
            {
              kode: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              nama: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {}

    const [rows, total] = await Promise.all([
      prisma.ruangan.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: sortOrder,
        },
      }),

      prisma.ruangan.count({
        where,
      }),
    ])

    res.status(200).json({
      ruangan: rows,

      pagination: {
        page,
        limit,
        totalRows: total,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
      },
    })
  } catch (error) {
    next(error)
  }
}

  static async getRuanganById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const r = await prisma.ruangan.findUnique({ where: { id: Number(id) } });
      if (!r) throw { name: "NotFound" };
      res.status(200).json(r);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRuanganById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      await prisma.$transaction(async (tx) => {
        const existing = await tx.ruangan.findUnique({
          where: { id }, select: { id: true, _count: { select: { jadwal: true } } },
        });
        if (!existing) throw { name: "NotFound", message: "Ruangan tidak ditemukan." };
        ensureUnused(existing._count, "Ruangan masih digunakan oleh data lain. Lepaskan relasinya sebelum menghapus.");
        await tx.ruangan.delete({ where: { id } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Ruangan berhasil dihapus", data: { id } });
    } catch (error) { next(error); }
  }
}

export default Controller;
