import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

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

  static async getAllJadwal(
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
          ? Number(
            req.query.tahunAkademikId
          )
          : undefined

      const hari =
        req.query.hari
          ? String(req.query.hari)
          : undefined

      // ==========================================
      // SORTING
      // ==========================================

      const sortBy =
        String(
          req.query.sortBy ?? "jamMulai"
        )

      const sortOrder =
        req.query.sortOrder === "asc"
          ? "asc"
          : "desc"

      // ==========================================
      // WHERE
      // ==========================================

      const where: Prisma.JadwalWhereInput = {
        ...(tahunAkademikId !== undefined && {
          tahunAkademikId,
        }),

        ...(hari !== undefined && {
          hari: hari as Prisma.EnumHariFilter,
        }),

        ...(prodiId !== undefined && {
          kelasMataKuliah: {
            kelas: {
              prodiId,
            },
          },
        }),

        ...(search
          ? {
            OR: [
              // Mata Kuliah
              {
                kelasMataKuliah: {
                  mataKuliah: {
                    kode: {
                      contains: search,
                      mode: Prisma.QueryMode
                        .insensitive,
                    },
                  },
                },
              },

              {
                kelasMataKuliah: {
                  mataKuliah: {
                    nama: {
                      contains: search,
                      mode: Prisma.QueryMode
                        .insensitive,
                    },
                  },
                },
              },

              // Kelas
              {
                kelasMataKuliah: {
                  kelas: {
                    nama: {
                      contains: search,
                      mode: Prisma.QueryMode
                        .insensitive,
                    },
                  },
                },
              },

              // Dosen
              {
                kelasMataKuliah: {
                  dosen: {
                    user: {
                      name: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              },

              // Ruangan
              {
                ruangan: {
                  nama: {
                    contains: search,
                    mode: Prisma.QueryMode
                      .insensitive,
                  },
                },
              },

              {
                ruangan: {
                  kode: {
                    contains: search,
                    mode: Prisma.QueryMode
                      .insensitive,
                  },
                },
              },
            ],
          }
          : {}),
      }

      // ==========================================
      // ORDER BY
      // ==========================================

      let orderBy:
        Prisma.JadwalOrderByWithRelationInput

      switch (sortBy) {
        case "mataKuliah":
          orderBy = {
            kelasMataKuliah: {
              mataKuliah: {
                nama: sortOrder,
              },
            },
          }
          break

        case "kelas":
          orderBy = {
            kelasMataKuliah: {
              kelas: {
                nama: sortOrder,
              },
            },
          }
          break

        case "dosen":
          orderBy = {
            kelasMataKuliah: {
              dosen: {
                user: {
                  name: sortOrder,
                },
              },
            },
          }
          break

        case "ruangan":
          orderBy = {
            ruangan: {
              nama: sortOrder,
            },
          }
          break

        case "jamMulai":
          orderBy = {
            jamMulai: sortOrder,
          }
          break

        default:
          orderBy = {
            createdAt: sortOrder,
          }
          break
      }

      // ==========================================
      // QUERY
      // ==========================================

      const [rows, total] =
        await Promise.all([
          prisma.jadwal.findMany({
            where,
            skip,
            take: limit,
            orderBy,

            include: {
              kelasMataKuliah: {
                include: {
                  mataKuliah: true,
                  kelas: true,
                  dosen: {
                    include: {
                      user: true,
                    },
                  },
                },
              },

              ruangan: true,

              tahunAkademik: true,
            },
          }),

          prisma.jadwal.count({
            where,
          }),
        ])

      // ==========================================
      // RESPONSE
      // ==========================================

      const jadwal = rows.map((item) => ({
        id: item.id,

        hari: item.hari,

        jamMulai: item.jamMulai,

        jamSelesai: item.jamSelesai,

        jam: `${item.jamMulai} - ${item.jamSelesai}`,

        mataKuliah:
          item.kelasMataKuliah.mataKuliah.nama,

        kodeMataKuliah:
          item.kelasMataKuliah.mataKuliah.kode,

        kelas:
          item.kelasMataKuliah.kelas.nama,

        dosen:
          item.kelasMataKuliah.dosen.user.name,

        ruangan:
          item.ruangan.nama,

        kodeRuangan:
          item.ruangan.kode,

        tahunAkademik:
          item.tahunAkademik.tahun,

        semester:
          item.tahunAkademik.semester,
      }))

      res.status(200).json({
        jadwal,

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
