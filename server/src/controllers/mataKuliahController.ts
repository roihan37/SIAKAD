import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createMataKuliah(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        kode,
        nama,
        sks,
        kurikulumId,
        semester,
        wajib,
      } = req.body

      // ==========================================
      // VALIDASI DASAR
      // ==========================================

      if (
        !kode ||
        !nama ||
        !kurikulumId ||
        !semester
      ) {
        return res.status(400).json({
          message:
            "Kode, nama, SKS, kurikulum, dan semester wajib diisi.",
        })
      }

      if (Number(sks) <= 0) {
        return res.status(400).json({
          message: "SKS harus lebih dari 0.",
        })
      }

      if (
        Number(semester) < 1 ||
        Number(semester) > 8
      ) {
        return res.status(400).json({
          message:
            "Semester harus berada antara 1 sampai 8.",
        })
      }

      // ==========================================
      // CEK KURIKULUM
      // ==========================================

      const kurikulum =
        await prisma.kurikulum.findUnique({
          where: {
            id: Number(kurikulumId),
          },
        })

      if (!kurikulum) {
        return res.status(404).json({
          message:
            "Kurikulum tidak ditemukan.",
        })
      }

      // ==========================================
      // CEK KODE MATA KULIAH
      // ==========================================

      const existing =
        await prisma.mataKuliah.findUnique({
          where: {
            kode: String(kode).trim(),
          },
        })

      if (existing) {
        return res.status(409).json({
          message:
            "Kode mata kuliah sudah digunakan.",
        })
      }

      // ==========================================
      // TRANSACTION
      // ==========================================

      const result =
        await prisma.$transaction(
          async (tx) => {
            // 1. Buat Mata Kuliah
            const mataKuliah =
              await tx.mataKuliah.create({
                data: {
                  kode: String(kode).trim(),
                  nama: String(nama).trim(),
                  sks: Number(sks),
                },
              })

            // 2. Hubungkan dengan Kurikulum
            const kurikulumMataKuliah =
              await tx.kurikulumMataKuliah.create({
                data: {
                  kurikulumId:
                    Number(kurikulumId),

                  mataKuliahId:
                    mataKuliah.id,

                  semester:
                    Number(semester),

                  wajib:
                    wajib ?? true,
                },
              })

            return {
              mataKuliah,
              kurikulumMataKuliah,
            }
          }
        )

      // ==========================================
      // RESPONSE
      // ==========================================

      res.status(201).json({
        message:
          "Mata Kuliah berhasil ditambahkan.",
        data: result,
      })
    } catch (error: any) {
      next(error)
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

  static async getAllMataKuliah(
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

      const sortOrder =
        req.query.sortOrder === "asc"
          ? "asc"
          : "desc"

      const skip = (page - 1) * limit

      const where: Prisma.MataKuliahWhereInput =
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
                kurikulum: {
                  some: {
                    kurikulum: {
                      prodi: {
                        name: {
                          contains: search,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
          : {}

      const [rows, total] =
        await Promise.all([
          prisma.mataKuliah.findMany({
            where,
            skip,
            take: limit,

            orderBy: {
              createdAt: sortOrder,
            },

            include: {
              kurikulum: {
                where: {
                  kurikulum: {
                    isActive: true,
                  },
                },

                include: {
                  kurikulum: {
                    include: {
                      prodi: true,
                    },
                  },
                },
              },
            },
          }),

          prisma.mataKuliah.count({
            where,
          }),
        ])

      const mataKuliah = rows.map(
        (mk) => {
          const kurikulumAktif =
            mk.kurikulum[0]

          return {
            id: mk.id,
            kode: mk.kode,
            nama: mk.nama,
            sks: mk.sks,

            prodi:
              kurikulumAktif
                ?.kurikulum
                .prodi
                .name ?? null,

            semester:
              kurikulumAktif
                ?.semester ?? null,
          }
        }
      )

      res.status(200).json({
        mataKuliah,

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
