import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
  static async createKelasMK(req: Request, res: Response, next: NextFunction) {
    try {
      const { kelasId, mataKuliahId, dosenId } = req.body;
      const k = await prisma.kelasMataKuliah.create({ data: { kelasId: Number(kelasId), mataKuliahId: Number(mataKuliahId), dosenId } });
      res.status(200).json({ message: "KelasMataKuliah created", k });
    } catch (error) { next(error); }
  }

  static async updateKelasMK(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kelasId, mataKuliahId, dosenId } = req.body;
      const k = await prisma.kelasMataKuliah.update({ where: { id: Number(id) }, data: { kelasId: Number(kelasId), mataKuliahId: Number(mataKuliahId), dosenId } });
      res.status(200).json({ message: "KelasMataKuliah updated", k });
    } catch (error) { next(error); }
  }

  static async getAllKelasMK(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.kelasMataKuliah.findMany();
      res.status(200).json({ kelasMataKuliah: rows });
    } catch (error) { next(error); }
  }

  static async getKelasMKById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kelasMataKuliah.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      res.status(200).json(k);
    } catch (error) { next(error); }
  }

  static async deleteKelasMKById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const k = await prisma.kelasMataKuliah.findUnique({ where: { id: Number(id) } });
      if (!k) throw { name: "NotFound" };
      await prisma.kelasMataKuliah.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `KelasMataKuliah ${k.id} deleted` });
    } catch (error) { next(error); }
  }
}

export default Controller;
