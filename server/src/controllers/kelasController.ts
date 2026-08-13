import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
  static async createKelas(req: Request, res: Response, next: NextFunction) {
    try {
      const { nama, prodiId, tahunAkademikId, tingkat } = req.body;
      const k = await prisma.kelas.create({ data: { nama, prodiId: Number(prodiId), tahunAkademikId: Number(tahunAkademikId), tingkat: Number(tingkat) } });
      res.status(200).json({ message: "Kelas created", k });
    } catch (error) { next(error); }
  }

  static async updateKelas(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nama, prodiId, tahunAkademikId, tingkat } = req.body;
      const k = await prisma.kelas.update({ where: { id: Number(id) }, data: { nama, prodiId: Number(prodiId), tahunAkademikId: Number(tahunAkademikId), tingkat: Number(tingkat) } });
      res.status(200).json({ message: "Kelas updated", k });
    } catch (error) { next(error); }
  }

  static async getAllKelas(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.kelas.findMany();
      res.status(200).json({ kelas: rows });
    } catch (error) { next(error); }
  }

  static async getKelasById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kelas.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      res.status(200).json(k);
    } catch (error) { next(error); }
  }

  static async deleteKelasById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kelas.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      await prisma.kelas.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `${k.nama} deleted` });
    } catch (error) { next(error); }
  }
}

export default Controller;
