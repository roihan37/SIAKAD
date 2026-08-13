import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
  static async createJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const { kelasMataKuliahId, tahunAkademikId, ruanganId, hari, jamMulai, jamSelesai } = req.body;
      const j = await prisma.jadwal.create({ data: { kelasMataKuliahId: Number(kelasMataKuliahId), tahunAkademikId: Number(tahunAkademikId), ruanganId: Number(ruanganId), hari, jamMulai, jamSelesai } });
      res.status(200).json({ message: "Jadwal created", j });
    } catch (error) { next(error); }
  }

  static async updateJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { kelasMataKuliahId, tahunAkademikId, ruanganId, hari, jamMulai, jamSelesai } = req.body;
      const j = await prisma.jadwal.update({ where: { id: Number(id) }, data: { kelasMataKuliahId: Number(kelasMataKuliahId), tahunAkademikId: Number(tahunAkademikId), ruanganId: Number(ruanganId), hari, jamMulai, jamSelesai } });
      res.status(200).json({ message: "Jadwal updated", j });
    } catch (error) { next(error); }
  }

  static async getAllJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.jadwal.findMany();
      res.status(200).json({ jadwal: rows });
    } catch (error) { next(error); }
  }

  static async getJadwalById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const j = await prisma.jadwal.findUnique({ where: { id: Number(id) } });
      if (!j) throw { name: "NotFound" };
      res.status(200).json(j);
    } catch (error) { next(error); }
  }

  static async deleteJadwalById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const j = await prisma.jadwal.findUnique({ where: { id: Number(id) } });
      if (!j) throw { name: "NotFound" };
      await prisma.jadwal.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `Jadwal ${j.id} deleted` });
    } catch (error) { next(error); }
  }
}

export default Controller;
