import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
  static async createKurikulum(req: Request, res: Response, next: NextFunction) {
    try {
      const { prodiId, mataKuliahId, semester, wajib } = req.body;
      const k = await prisma.kurikulum.create({ data: { prodiId: Number(prodiId), mataKuliahId: Number(mataKuliahId), semester: Number(semester), wajib: Boolean(wajib) } });
      res.status(200).json({ message: "Kurikulum created", k });
    } catch (error) { next(error); }
  }

  static async updateKurikulum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { prodiId, mataKuliahId, semester, wajib } = req.body;
      const k = await prisma.kurikulum.update({ where: { id: Number(id) }, data: { prodiId: Number(prodiId), mataKuliahId: Number(mataKuliahId), semester: Number(semester), wajib: Boolean(wajib) } });
      res.status(200).json({ message: "Kurikulum updated", k });
    } catch (error) { next(error); }
  }

  static async getAllKurikulum(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.kurikulum.findMany();
      res.status(200).json({ kurikulum: rows });
    } catch (error) { next(error); }
  }

  static async getKurikulumById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      res.status(200).json(k);
    } catch (error) { next(error); }
  }

  static async deleteKurikulumById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      await prisma.kurikulum.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `Kurikulum ${k.id} deleted` });
    } catch (error) { next(error); }
  }
}

export default Controller;
