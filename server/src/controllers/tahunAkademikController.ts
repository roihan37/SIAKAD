import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createTahunAkademik(req: Request, res: Response, next: NextFunction) {
    try {
      const { tahun, semester } = req.body;
      const ta = await prisma.tahunAkademik.create({ data: { tahun, semester } });
      res.status(200).json({ message: "Tahun Akademik created", ta });
    } catch (error) {
      next(error);
    }
  }

  static async updateTahunAkademik(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tahun, semester } = req.body;
      const ta = await prisma.tahunAkademik.update({ where: { id: Number(id) }, data: { tahun, semester } });
      res.status(200).json({ message: "Tahun Akademik updated", ta });
    } catch (error) {
      next(error);
    }
  }

  static async getAllTahunAkademik(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await prisma.tahunAkademik.findMany();
      res.status(200).json({ tahunAkademik: rows });
    } catch (error) {
      next(error);
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
      const { id } = req.params;
      const ta = await prisma.tahunAkademik.findUnique({ where: { id: Number(id) } });
      if (!ta) throw { name: "NotFound" };
      await prisma.tahunAkademik.delete({ where: { id: Number(id) } });
      res.status(200).json({ message: `${ta.tahun} deleted` });
    } catch (error) {
      next(error);
    }
  }
}

export default Controller;
