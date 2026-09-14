import { validateSchedule } from "../services/schedule.service";
import { resourceId, patchBody } from "../validation/master-data";
import { jadwalCreate, jadwalPatch } from "../validation/academic-data";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const HARI_URUTAN: Record<string, number> = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
}

export class Controller {
  static async createJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = jadwalCreate(req.body);
      const j = await prisma.$transaction(async (tx) => {
        await validateSchedule(tx, data);
        return tx.jadwal.create({ data: { ...data, hariUrutan: HARI_URUTAN[data.hari] } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(201).json({ message: "Jadwal created", data: j, j });
    } catch (error) { next(error); }
  }

  static async updateJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const id = resourceId(req.params.id);
      const patch = patchBody(req.body, jadwalPatch);
      const j = await prisma.$transaction(async (tx) => {
        const existing = await tx.jadwal.findUnique({ where: { id } });
        if (!existing) throw { name: "NotFound", message: "Jadwal tidak ditemukan." };
        const data = { ...existing, ...patch };
        await validateSchedule(tx, data, id);
        return tx.jadwal.update({ where: { id }, data: { ...patch, hariUrutan: HARI_URUTAN[data.hari] } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.status(200).json({ message: "Jadwal berhasil diperbarui", data: j, j });
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
          req.query.sortBy ?? "hari"
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
        | Prisma.JadwalOrderByWithRelationInput
        | Prisma.JadwalOrderByWithRelationInput[]

      switch (sortBy) {
        case "hari":
          orderBy = [
            {
              hariUrutan: sortOrder,
            },
            {
              jamMulai: sortOrder,
            },
          ]
          break

        case "jamMulai":
          orderBy = {
            jamMulai: sortOrder,
          }
          break

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

        default:
          orderBy = [
            {
              hariUrutan: "asc",
            },
            {
              jamMulai: "asc",
            },
          ]
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
      const id = resourceId(req.params.id);
      await prisma.jadwal.delete({ where: { id } });
      res.status(200).json({ message: "Jadwal berhasil dihapus", data: { id } });
    } catch (error) { next(error); }
  }
}

export default Controller;
