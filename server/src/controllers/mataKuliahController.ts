import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createMataKuliah(req: Request, res: Response, next: NextFunction) {
    try {
      const { kode, nama, sks } = req.body;
      const mk = await prisma.mataKuliah.create({ data: { kode, nama, sks } });
      res.status(200).json({ message: "Mata Kuliah created", mk });
    } catch (error) {
      next(error);
    }
  }

  static async updateMataKuliah(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kode, nama, sks } = req.body;
      const mk = await prisma.mataKuliah.update({ where: { id: Number(id) }, data: { kode, nama, sks } });
      res.status(200).json({ message: "Mata Kuliah updated", mk });
    } catch (error) {
      next(error);
    }
  }

  static async getAllMataKuliah(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = String(req.query.search ?? "");
      const skip = (page - 1) * limit;

      const where: Prisma.MataKuliahWhereInput = search
        ? { OR: [{ kode: { contains: search, mode: Prisma.QueryMode.insensitive } }, 
          { nama: { contains: search, mode: Prisma.QueryMode.insensitive } }] }
        : {};

      const [rows, total] = await Promise.all([
        prisma.mataKuliah.findMany({ where, skip, take: limit, include: { kurikulum: { include: { prodi: true } } } }),
        prisma.mataKuliah.count({ where }),
      ]);

      // Flatten results so each output row contains: Kode | Mata Kuliah | SKS | Prodi | Semester
      const flattened = [] as Array<{ kode: string; nama: string; sks: number; prodi: string | null; semester: number | null }>;
      for (const mk of rows) {
        if (mk.kurikulum && mk.kurikulum.length > 0) {
          for (const k of mk.kurikulum) {
            flattened.push({ kode: mk.kode, nama: mk.nama, sks: mk.sks, prodi: k.prodi?.name ?? null, semester: k.semester ?? null });
          }
        } else {
          flattened.push({ kode: mk.kode, nama: mk.nama, sks: mk.sks, prodi: null, semester: null });
        }
      }

      res.status(200).json({ mataKuliah: flattened, pagination: { page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), totalRows: total } });
    } catch (error) {
      next(error);
    }
  }

  static async getMataKuliahById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mk = await prisma.mataKuliah.findUnique({ where: { id: Number(id) } });
      if (!mk) throw { name: "NotFound" };
      res.status(200).json(mk);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMataKuliahById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mk = await prisma.mataKuliah.findUnique({ where: { id: Number(id) } });
      if (!mk) throw { name: "NotFound" };
      await prisma.mataKuliah.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `${mk.nama} deleted` });
    } catch (error) {
      next(error);
    }
  }
}

export default Controller;
