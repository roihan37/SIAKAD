import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  // static async createKurikulum(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { prodiId, mataKuliahId, semester, wajib } = req.body;
  //     const k = await prisma.kurikulum.create({ data: { prodiId: Number(prodiId), mataKuliahId: Number(mataKuliahId), semester: Number(semester), wajib: Boolean(wajib) } });
  //     res.status(200).json({ message: "Kurikulum created", k });
  //   } catch (error) { next(error); }
  // }

  // static async updateKurikulum(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { id } = req.params;
  //     const { prodiId, mataKuliahId, semester, wajib } = req.body;
  //     const k = await prisma.kurikulum.update({ where: { id: Number(id) }, data: { prodiId: Number(prodiId), mataKuliahId: Number(mataKuliahId), semester: Number(semester), wajib: Boolean(wajib) } });
  //     res.status(200).json({ message: "Kurikulum updated", k });
  //   } catch (error) { next(error); }
  // }

  static async getAllKurikulum(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page =
      Number(req.query.page) || 1

    const limit =
      Number(req.query.limit) || 10

    const search =
      String(req.query.search ?? "").trim()

    const sortBy =
      String(req.query.sortBy ?? "createdAt")

    const sortOrder =
      req.query.sortOrder === "asc"
        ? "asc"
        : "desc"

    const skip = (page - 1) * limit

    const where: Prisma.KurikulumWhereInput =
      search
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
              {
                prodi: {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            ],
          }
        : {}

    const [rows, total] =
      await Promise.all([
        prisma.kurikulum.findMany({
          where,
          skip,
          take: limit,

          include: {
            prodi: true,

            mataKuliah: {
              include: {
                mataKuliah: true,
              },
            },
          },

          orderBy:
            sortBy === "kode"
              ? {
                  kode: sortOrder,
                }
              : sortBy === "nama"
                ? {
                    nama: sortOrder,
                  }
                : sortBy === "tahun"
                  ? {
                      tahun: sortOrder,
                    }
                  : sortBy === "status"
                    ? {
                        isActive: sortOrder,
                      }
                    : sortBy === "prodi"
                      ? {
                          prodi: {
                            name: sortOrder,
                          },
                        }
                      : {
                          createdAt: sortOrder,
                        },
        }),

        prisma.kurikulum.count({
          where,
        }),
      ])

    const kurikulum = rows.map((item) => {
      const totalSks =
        item.mataKuliah.reduce(
          (total, detail) =>
            total + detail.mataKuliah.sks,
          0
        )

      return {
        id: item.id,

        kode: item.kode,

        namaKurikulum: item.nama,

        namaProdi: item.prodi.name,

        tahun: item.tahun,

        totalSks,

        status: item.isActive
          ? "Aktif"
          : "Tidak Aktif",
      }
    })

    res.status(200).json({
      kurikulum,

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

  // static async getKurikulumById(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { id } = req.params;
  //     const k = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
  //     if (!k) throw { name: "NotFound" };
  //     res.status(200).json(k);
  //   } catch (error) { next(error); }
  // }

  // static async deleteKurikulumById(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { id } = req.params;
  //     const k = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
  //     if (!k) throw { name: "NotFound" };
  //     await prisma.kurikulum.delete({ where: { id: Number(id) } });
  //     res.status(200).json({ message: `Kurikulum ${k.id} deleted` });
  //   } catch (error) { next(error); }
  // }
}

export default Controller;
