import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
  static async createKRS(req: Request, res: Response, next: NextFunction) {
    try {
      const { mahasiswaId, tahunAkademikId } = req.body;
      const k = await prisma.kRS.create({ data: { mahasiswaId, tahunAkademikId: Number(tahunAkademikId) } });
      res.status(200).json({ message: "KRS created", k });
    } catch (error) { next(error); }
  }

  static async updateKRS(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { mahasiswaId, tahunAkademikId } = req.body;
      const k = await prisma.kRS.update({ where: { id }, data: { mahasiswaId, tahunAkademikId: Number(tahunAkademikId) } });
      res.status(200).json({ message: "KRS updated", k });
    } catch (error) { next(error); }
  }

  static async getAllKRS(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.kRS.findMany();
      res.status(200).json({ krs: rows });
    } catch (error) { next(error); }
  }

  static async getKRSById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const k = await prisma.kRS.findUnique({ where: { id } });
      if (!k) throw { name: "NotFound" };
      res.status(200).json(k);
    } catch (error) { next(error); }
  }

  static async deleteKRSById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const k = await prisma.kRS.findUnique({ where: { id } });
      if (!k) throw { name: "NotFound" };
      await prisma.kRS.delete({ where: { id } });
      res.status(200).json({ message: `KRS ${k.id} deleted` });
    } catch (error) { next(error); }
  }
}

export default Controller;
