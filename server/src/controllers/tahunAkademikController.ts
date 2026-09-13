import { resourceId, patchBody, ensureUnused, tahunAkademikPatch } from "../validation/master-data";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createTahunAkademik(req: Request, res: Response, next: NextFunction) {
    try {
      const { tahun, semester, isActive } = req.body

      const ta = await prisma.tahunAkademik.create({
        data: {
          tahun,
          semester,
          isActive,
        },
      })
      res.status(200).json({ message: "Tahun Akademik created", ta });
    } catch (error) {
      next(error);
    }
  }

  static async updateTahunAkademik(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      const data = patchBody(req.body, tahunAkademikPatch);
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.tahunAkademik.findUnique({ where: { id } });
        if (!existing) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
        return tx.tahunAkademik.update({ where: { id }, data });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Tahun akademik berhasil diperbarui", data: updated, ta: updated });
    } catch (error) { next(error); }
  }

  static async getAllTahunAkademik(
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

      const where: Prisma.TahunAkademikWhereInput =
        search
          ? {
            OR: [
              {
                tahun: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                semester: {
                  equals: search as any,
                },
              },
            ],
          }
          : {}

      const [rows, total] = await Promise.all([
        prisma.tahunAkademik.findMany({
          where,
          skip,
          take: limit,

          orderBy: {
            createdAt: sortOrder,
          },
        }),

        prisma.tahunAkademik.count({
          where,
        }),
      ])

      res.status(200).json({
        tahunAkademik: rows,

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

  static async getTahunAkademikById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ta = await prisma.tahunAkademik.findUnique({ where: { id: Number(id) } });
      if (!ta) throw { name: "NotFound" };
      res.status(200).json(ta);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTahunAkademikById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      await prisma.$transaction(async (tx) => {
        const existing = await tx.tahunAkademik.findUnique({
          where: { id }, select: { id: true, _count: { select: { kelas: true, jadwal: true, krs: true, periode: true } } },
        });
        if (!existing) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
        ensureUnused(existing._count, "Tahun akademik masih digunakan oleh data lain. Lepaskan relasinya sebelum menghapus.");
        await tx.tahunAkademik.delete({ where: { id } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Tahun akademik berhasil dihapus", data: { id } });
    } catch (error) { next(error); }
  }
}

export default Controller;
