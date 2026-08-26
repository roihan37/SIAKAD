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

            status:
              item.isActive
                ? "Aktif"
                : "Tidak Aktif",
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
