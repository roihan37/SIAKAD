import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

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

  static async getAllKRS(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // ==========================================
      // PAGINATION
      // ==========================================

      const page =
        Number(req.query.page) || 1

      const limit =
        Number(req.query.limit) || 10

      const skip =
        (page - 1) * limit

      // ==========================================
      // SEARCH
      // ==========================================

      const search =
        String(
          req.query.search ?? ""
        ).trim()

      // ==========================================
      // FILTER
      // ==========================================

      const prodiId =
        req.query.prodiId
          ? Number(req.query.prodiId)
          : undefined

      const tahunAkademikId =
        req.query.tahunAkademikId
          ? Number(req.query.tahunAkademikId)
          : undefined

      const angkatan =
        req.query.angkatan
          ? Number(req.query.angkatan)
          : undefined

      const status =
        req.query.status
          ? String(req.query.status)
          : undefined

      const krsWhere: Prisma.KRSWhereInput =
        tahunAkademikId !== undefined
          ? { tahunAkademikId }
          : {}

      // ==========================================
      // SORTING
      // ==========================================

      const sortBy =
        String(
          req.query.sortBy ?? "nama"
        )

      const sortOrder =
        req.query.sortOrder === "asc"
          ? "asc"
          : "desc"

      // ==========================================
      // WHERE MAHASISWA
      // ==========================================

      const where: Prisma.MahasiswaWhereInput = {
        status: "Aktif",

        ...(prodiId !== undefined && {
          prodiId,
        }),

        ...(angkatan !== undefined && {
          angkatan,
        }),

        ...(search
          ? {
            OR: [
              {
                nim: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },

              {
                user: {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
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
          : {}),
      }

      // ==========================================
      // QUERY
      // ==========================================

      const [rows, total, totalMahasiswaAktif, totalKRSDisetujui, totalKRSMenunggu, totalBelumKRS] =
        await Promise.all([
          prisma.mahasiswa.findMany({
            where,

            skip,
            take: limit,

            include: {
              user: true,
              prodi: true,

              krs: {
                where:
                  tahunAkademikId !== undefined
                    ? {
                      tahunAkademikId,
                    }
                    : undefined,

                include: {
                  details: {
                    include: {
                      kelasMataKuliah: {
                        include: {
                          mataKuliah: true,
                        },
                      },
                    },
                  },

                  tahunAkademik: true,
                },
              },
            },

            orderBy:
              sortBy === "nim"
                ? {
                  nim: sortOrder,
                }
                : sortBy === "angkatan"
                  ? {
                    angkatan: sortOrder,
                  }
                  : {
                    user: {
                      name: sortOrder,
                    },
                  },
          }),

          prisma.mahasiswa.count({
            where,
          }),

          prisma.mahasiswa.count({
            where: {
              status: "Aktif",
            },
          }),

          prisma.mahasiswa.count({
            where: {
              status: "Aktif",
              krs: {
                some: {
                  ...krsWhere,
                  status: "DISETUJUI",
                },
              },
            },
          }),

          prisma.mahasiswa.count({
            where: {
              status: "Aktif",
              krs: {
                some: {
                  ...krsWhere,
                  status: {
                    not: "DISETUJUI",
                  },
                },
              },
            },
          }),

          prisma.mahasiswa.count({
            where: {
              status: "Aktif",
              krs: {
                none: krsWhere,
              },
            },
          }),
        ])

      // ==========================================
      // MAPPING
      // ==========================================

      let krs = rows.map((mahasiswa) => {
        const currentKRS =
          mahasiswa.krs[0]

        const totalSks =
          currentKRS?.details.reduce(
            (total, detail) =>
              total +
              detail.kelasMataKuliah
                .mataKuliah.sks,
            0
          ) ?? 0

        let currentStatus =
          currentKRS
            ? "MENUNGGU"
            : "BELUM_KRS"

        // Jika nanti KRS punya field status,
        // gunakan status dari database.
        //
        // currentStatus = currentKRS?.status ?? "MENUNGGU"

        return {
          id: mahasiswa.id,

          krsId:
            currentKRS?.id ?? null,

          nim: mahasiswa.nim,

          nama:
            mahasiswa.user.name,

          prodi:
            mahasiswa.prodi.name,

          angkatan:
            mahasiswa.angkatan,

          totalSks,

          status: currentStatus,

          tahunAkademik:
            currentKRS?.tahunAkademik
              ? {
                id:
                  currentKRS.tahunAkademik.id,

                tahun:
                  currentKRS.tahunAkademik.tahun,

                semester:
                  currentKRS.tahunAkademik.semester,
              }
              : null,
        }
      })

      // ==========================================
      // FILTER STATUS
      // ==========================================

      if (status) {
        krs = krs.filter(
          (item) =>
            item.status === status
        )
      }

      // ==========================================
      // RESPONSE
      // ==========================================
      
      res.status(200).json({
        krs,

        summary: {
          totalMahasiswaAktif,
          totalKRSDisetujui,
          totalKRSMenunggu,
          totalBelumKRS,
        },

        pagination: {
          page,
          limit,

          totalRows: total,

          totalPages: Math.max(
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
