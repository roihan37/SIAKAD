import { resourceId, patchBody, ensureUnused, kurikulumPatch } from "../validation/master-data";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class Controller {
  static async createKurikulum(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        kode,
        nama,
        prodiId,
        tahun,
        isActive,
      } = req.body

      const kurikulum =
        await prisma.kurikulum.create({
          data: {
            kode: String(kode).trim(),
            nama: String(nama).trim(),
            prodiId: Number(prodiId),
            tahun: Number(tahun),
            isActive
          },
          include: {
            prodi: true,
          },
        })
        
      res.status(201).json({
        message: "Kurikulum berhasil dibuat",
        kurikulum,
      })
    } catch (error) {
      next(error)
    }
  }


  static async updateKurikulum(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      const data = patchBody(req.body, kurikulumPatch);
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.kurikulum.findUnique({ where: { id } });
        if (!existing) throw { name: "NotFound", message: "Kurikulum tidak ditemukan." };
        if (data.prodiId !== undefined && !await tx.prodi.findUnique({ where: { id: data.prodiId }, select: { id: true } })) {
          throw { name: "NotFound", message: "Prodi tidak ditemukan." };
        }
        if (data.prodiId !== undefined && data.prodiId !== existing.prodiId) {
          const courses = await tx.kurikulumMataKuliah.count({ where: { kurikulumId: id } });
          if (courses > 0) throw { name: "Conflict", message: "Kurikulum yang sudah memiliki mata kuliah tidak dapat dipindahkan ke prodi lain." };
        }
        return tx.kurikulum.update({ where: { id }, data });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Kurikulum berhasil diperbarui", data: updated, k: updated });
    } catch (error) { next(error); }
  }

  static async getAllKurikulum(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // =====================================================
      // PAGINATION
      // =====================================================

      const page =
        Number(req.query.page) || 1

      const limit =
        Number(req.query.limit) || 10

      const skip =
        (page - 1) * limit

      // =====================================================
      // SEARCH
      // =====================================================

      const search =
        String(
          req.query.search ?? ""
        ).trim()

      // =====================================================
      // SORT
      // =====================================================

      const sortBy =
        String(
          req.query.sortBy ?? "createdAt"
        )

      const sortOrder =
        req.query.sortOrder === "asc"
          ? "asc"
          : "desc"

      // =====================================================
      // WHERE
      // =====================================================
      const searchNumber = Number(search)

      const isYearSearch =
        search !== "" &&
        Number.isInteger(searchNumber)
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

              ...(isYearSearch
                ? [
                  {
                    tahun: searchNumber,
                  },
                ]
                : []),
            ],
          }
          : {}

      // =====================================================
      // ORDER BY
      // =====================================================

      let orderBy:
        Prisma.KurikulumOrderByWithRelationInput

      switch (sortBy) {
        case "kode":
          orderBy = {
            kode: sortOrder,
          }
          break

        case "nama":
          orderBy = {
            nama: sortOrder,
          }
          break

        case "prodi":
          orderBy = {
            prodi: {
              name: sortOrder,
            },
          }
          break

        case "tahun":
          orderBy = {
            tahun: sortOrder,
          }
          break

        case "status":
          orderBy = {
            isActive: sortOrder,
          }
          break

        case "createdAt":
        default:
          orderBy = {
            createdAt: sortOrder,
          }
          break
      }

      // =====================================================
      // QUERY
      // =====================================================

      const [rows, total] =
        await Promise.all([
          prisma.kurikulum.findMany({
            where,

            skip,
            take: limit,

            orderBy,

            include: {
              prodi: {
                select: {
                  id: true,
                  kode: true,
                  name: true,
                },
              },

              mataKuliah: {
                select: {
                  semester: true,

                  mataKuliah: {
                    select: {
                      id: true,
                      kode: true,
                      nama: true,
                      sks: true,
                    },
                  },
                },
              },
            },
          }),

          prisma.kurikulum.count({
            where,
          }),
        ])

      // =====================================================
      // FORMAT RESPONSE
      // =====================================================

      const kurikulum = rows.map(
        (item) => {
          const totalSks =
            item.mataKuliah.reduce(
              (total, km) =>
                total +
                km.mataKuliah.sks,
              0
            )

          return {
            id: item.id,

            kode: item.kode,

            nama: item.nama,

            prodi:
              item.prodi.name,

            tahun:
              item.tahun,

            totalSks,

            isActive:
              item.isActive
          }
        }
      )

      // =====================================================
      // RESPONSE
      // =====================================================


      res.status(200).json({
        kurikulum,

        pagination: {
          page,
          limit,

          totalRows: total,

          totalPages:
            Math.max(
              1,
              Math.ceil(
                total / limit
              )
            ),
        },
      })
    } catch (error) {
      next(error)
    }
  }


  static async deleteKurikulumById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      await prisma.$transaction(async (tx) => {
        const existing = await tx.kurikulum.findUnique({
          where: { id }, select: { id: true, _count: { select: { mataKuliah: true } } },
        });
        if (!existing) throw { name: "NotFound", message: "Kurikulum tidak ditemukan." };
        ensureUnused(existing._count, "Kurikulum masih digunakan oleh data lain. Lepaskan relasinya sebelum menghapus.");
        await tx.kurikulum.delete({ where: { id } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Kurikulum berhasil dihapus", data: { id } });
    } catch (error) { next(error); }
  }

  static async getKurikulumById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      const kurikulum = await prisma.kurikulum.findUnique({ where: { id }, include: { prodi: true, mataKuliah: { include: { mataKuliah: true } } } });
      if (!kurikulum) throw { name: "NotFound", message: "Kurikulum tidak ditemukan." };
      res.status(200).json(kurikulum);
    } catch (error) { next(error); }
  }

}

export default Controller;
