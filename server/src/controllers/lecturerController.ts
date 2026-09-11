import { NextFunction, Request, Response } from "express";
import { Prisma, Gender, Status, JabatanDosen, Pendidikan } from "@prisma/client";
import { hashPassword } from "../lib/bycript";
import { prisma } from "../lib/prisma";
import { S3Service } from "../services/s3.service";
import { AvatarService } from "../services/avatar.service";

export class Controller {
    static async createLecturer(req: Request, res: Response, next: NextFunction) {
        const {
            name, email, username, password, phoneNumber, gender, address,
            nidn, status, jabatan, prodiId, birthDate, avatarKey,
        } = req.body;
        try {

            let avatarUrl: string | undefined;
            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
            }

            const lecturer = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name,
                        email,
                        username,
                        password: hashPassword(password),
                        birthDate,
                        role: "Dosen",
                        phoneNumber,
                        gender,
                        address,
                        avatarKey,
                        avatarUrl,
                    },
                });

                await tx.dosen.create({
                    data: { nidn, status, jabatan, prodiId: Number(prodiId), userId: user.id },
                });

                return user;
            });

            res.status(201).json({ message: `${lecturer.name} created successfully`, data: lecturer.id });
        } catch (error) {
            if (avatarKey) {
                try {
                    await AvatarService.deleteObject(
                        avatarKey
                    );
                } catch (cleanupError) {
                    console.error(
                        "Failed to cleanup avatar:",
                        cleanupError
                    );
                }
            }
            next(error);
        }
    }

    static async updateLecturerById(req: Request, res: Response, next: NextFunction) {
        let newAvatarKeyForCleanup: string | null = null;
        try {
            const { id } = req.params;
            const invalid = (message: string): never => { throw { name: "LecturerValidationError", message }; };
            if (typeof id !== "string" || !id.trim()) return invalid("ID user dosen wajib diisi");
            const body = req.body;
            if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("Body harus berupa objek");

            const existingUser = await prisma.user.findUnique({
                where: { id, role: "Dosen" },
                select: { id: true, avatarKey: true, dosen: { select: { id: true } } },
            });
            if (!existingUser?.dosen) throw { name: "NotFound", message: "Dosen tidak ditemukan" };

            const userData: Prisma.UserUpdateInput = {};
            const dosenData: Prisma.DosenUpdateWithoutUserInput = {};
            for (const field of ["name", "email", "username"] as const) {
                if (body[field] === undefined) continue;
                if (typeof body[field] !== "string" || !body[field].trim()) return invalid(`${field} wajib berupa teks yang tidak kosong`);
                userData[field] = body[field].trim();
            }
            if (typeof userData.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) return invalid("Format email tidak valid");
            for (const field of ["phoneNumber", "address", "nik", "birthPlace"] as const) {
                if (body[field] === undefined) continue;
                if (body[field] !== null && typeof body[field] !== "string") return invalid(`${field} harus berupa teks atau null`);
                userData[field] = body[field]?.trim() || null;
            }
            if (body.gender !== undefined) {
                if (!Object.values(Gender).includes(body.gender)) return invalid("Jenis kelamin tidak valid");
                userData.gender = body.gender;
            }
            if (body.birthDate !== undefined) {
                if (body.birthDate === null || body.birthDate === "") userData.birthDate = null;
                else {
                    if (typeof body.birthDate !== "string") return invalid("Tanggal lahir tidak valid");
                    const date = new Date(body.birthDate);
                    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(body.birthDate) ||
                        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.birthDate.slice(0, 10) || date > new Date()) {
                        return invalid("Tanggal lahir tidak valid");
                    }
                    userData.birthDate = date;
                }
            }
            if (body.password !== undefined && body.password !== "") {
                if (typeof body.password !== "string" || body.password.length < 8) return invalid("Password minimal 8 karakter");
                userData.password = hashPassword(body.password);
            }
            if (body.nidn !== undefined) {
                if (typeof body.nidn !== "string" || !body.nidn.trim()) return invalid("NIDN wajib berupa teks yang tidak kosong");
                dosenData.nidn = body.nidn.trim();
            }
            if (body.status !== undefined) {
                if (!Object.values(Status).includes(body.status)) return invalid("Status dosen tidak valid");
                dosenData.status = body.status;
            }
            if (body.jabatan !== undefined) {
                if (!Object.values(JabatanDosen).includes(body.jabatan)) return invalid("Jabatan dosen tidak valid");
                dosenData.jabatan = body.jabatan;
            }
            if (body.pendidikanTerakhir !== undefined) {
                const pendidikan = body.pendidikanTerakhir === "" ? null : body.pendidikanTerakhir;
                if (pendidikan !== null && !Object.values(Pendidikan).includes(pendidikan)) return invalid("Pendidikan terakhir tidak valid");
                dosenData.pendidikanTerakhir = pendidikan;
            }
            if (body.bidangKeahlian !== undefined) {
                if (body.bidangKeahlian !== null && typeof body.bidangKeahlian !== "string") return invalid("Bidang keahlian harus berupa teks atau null");
                dosenData.bidangKeahlian = body.bidangKeahlian?.trim() || null;
            }
            if (body.prodiId !== undefined) {
                if (!["string", "number"].includes(typeof body.prodiId)) return invalid("Prodi tidak valid");
                const prodiId = Number(body.prodiId);
                if (!Number.isSafeInteger(prodiId) || prodiId <= 0) return invalid("Prodi tidak valid");
                const prodi = await prisma.prodi.findUnique({ where: { id: prodiId }, select: { id: true } });
                if (!prodi) throw { name: "NotFound", message: "Prodi tidak ditemukan" };
                dosenData.prodi = { connect: { id: prodiId } };
            }

            if (body.avatarKey !== undefined) {
                const key = body.avatarKey === "" ? null : body.avatarKey;
                if (key !== null) {
                    if (typeof key !== "string" || !key.startsWith(`lecturers/${id}/`)) return invalid("Avatar harus milik dosen yang diperbarui");
                    if (!await S3Service.checkObjectExists(key)) return invalid("File avatar tidak ditemukan");
                    if (key !== existingUser.avatarKey) newAvatarKeyForCleanup = key;
                }
                userData.avatarKey = key;
                userData.avatarUrl = null;
            }

            // Nested update menyimpan profil akun dan dosen secara atomik.
            const lecturer = await prisma.user.update({
                where: { id, role: "Dosen" },
                data: { ...userData, dosen: { update: dosenData } },
                select: {
                    id: true, name: true, email: true, username: true, gender: true,
                    phoneNumber: true, address: true, nik: true, birthPlace: true,
                    birthDate: true, avatarKey: true,
                    dosen: { select: {
                        id: true, nidn: true, status: true, jabatan: true,
                        pendidikanTerakhir: true, bidangKeahlian: true,
                        prodi: { select: { id: true, name: true } },
                    } },
                },
            });
            newAvatarKeyForCleanup = null;
            if (body.avatarKey !== undefined && existingUser.avatarKey && existingUser.avatarKey !== lecturer.avatarKey) {
                try { await S3Service.deleteUrl(existingUser.avatarKey); }
                catch (error) { console.error("Gagal menghapus avatar lama dosen:", error); }
            }
            const avatarUrl = lecturer.avatarKey ? await S3Service.createReadUrl(lecturer.avatarKey) : null;
            const { avatarKey: _avatarKey, ...profile } = lecturer;
            return res.status(200).json({ message: "Dosen berhasil diperbarui", data: { ...profile, avatarUrl } });
        } catch (error) {
            if (newAvatarKeyForCleanup) {
                try { await S3Service.deleteUrl(newAvatarKeyForCleanup); }
                catch (cleanupError) { console.error("Gagal cleanup avatar baru dosen:", cleanupError); }
            }
            if ((error as { name?: string })?.name === "LecturerValidationError") {
                return res.status(400).json({ code: "VALIDATION_ERROR", message: (error as { message: string }).message });
            }
            next(error);
        }
    }

    static async deleteLecturerById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const lecturer = await prisma.user.findFirst({ where: { id, role: "Dosen" } });
            if (!lecturer) throw { name: "NotFound", message: "Dosen tidak ditemukan" };

            await prisma.user.delete({ where: { id } });
            if (lecturer.avatarKey) await S3Service.deleteUrl(lecturer.avatarKey);

            res.status(200).json({ message: `${lecturer.name} berhasil dihapus` });
        } catch (error) {
            next(error);
        }
    }

    static async getAllLecturers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Number(req.query.limit) || 10);
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
            const prodiId = Number(req.query.prodiId);

            const where: Prisma.UserWhereInput = {
                role: "Dosen",
                ...(prodiId ? { dosen: { prodiId } } : {}),
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        { dosen: { nidn: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                    ],
                } : {}),
            };
            const sortableFields: Record<string, Prisma.UserOrderByWithRelationInput> = {
                name: { name: sortOrder },
                nidn: { dosen: { nidn: sortOrder } },
                jabatan: { dosen: { jabatan: sortOrder } },
            };

            const [lecturers, totalRows] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: sortableFields[sortBy] ?? { name: sortOrder },
                    select: {
                        id: true, name: true, email: true, username: true, role: true, avatarUrl: true,
                        dosen: {
                            select: {
                                id: true, nidn: true, status: true, jabatan: true,
                                prodi: { select: { id: true, name: true } },
                            },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            res.status(200).json({
                lecturers,
                pagination: { page, limit, totalRows, totalPages: Math.max(1, Math.ceil(totalRows / limit)) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getLecturerById(req: Request, res: Response, next: NextFunction) {
        try {
            const lecturer = await prisma.user.findFirst({
                where: { id: String(req.params.id), role: "Dosen" },
                select: {
                    id: true,
                    name: true,
                    gender: true,
                    birthPlace: true,
                    birthDate: true,
                    email: true,
                    phoneNumber: true,
                    address: true,
                    avatarKey: true,
                    dosen: {
                        select: {
                            id: true,
                            nidn: true,
                            pendidikanTerakhir: true,
                            bidangKeahlian: true,
                            prodi: {
                                select: {
                                    id: true,
                                    name: true,
                                    fakultas: { select: { id: true, name: true } },
                                },
                            },
                            _count: { select: { mahasiswa: true } },
                            kelasMataKuliahs: {
                                where: { kelas: { tahunAkademik: { isActive: true } } },
                                select: {
                                    kelasId: true,
                                    mataKuliahId: true,
                                    _count: {
                                        select: {
                                            jadwal: { where: { tahunAkademik: { isActive: true } } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!lecturer) throw { name: "NotFound", message: "Dosen tidak ditemukan" };

            const { dosen } = lecturer;
            const prodi = dosen?.prodi;
            const fakultas = prodi?.fakultas;
            const assignments = dosen?.kelasMataKuliahs ?? [];
            const avatarUrl = lecturer.avatarKey
                ? await S3Service.createReadUrl(lecturer.avatarKey)
                : null;

            return res.status(200).json({
                lecturer: {
                    id: lecturer.id,
                    dosenId: dosen?.id ?? null,
                    nidn: dosen?.nidn ?? null,
                    pendidikanTerakhir: dosen?.pendidikanTerakhir ?? null,
                    bidangKeahlian: dosen?.bidangKeahlian ?? null,
                    nama: lecturer.name,
                    jenisKelamin: lecturer.gender === "Male"
                        ? "Laki-laki"
                        : lecturer.gender === "Female" ? "Perempuan" : null,
                    tempatLahir: lecturer.birthPlace ?? null,
                    tanggalLahir: lecturer.birthDate?.toISOString().slice(0, 10) ?? null,
                    email: lecturer.email,
                    noHp: lecturer.phoneNumber ?? null,
                    alamat: lecturer.address ?? null,
                    avatarUrl,
                    prodi: prodi ? { id: prodi.id, nama: prodi.name } : null,
                    fakultas: fakultas ? { id: fakultas.id, nama: fakultas.name } : null,
                    summary: {
                        mataKuliahDiampu: dosen ? new Set(assignments.map((item) => item.mataKuliahId)).size : null,
                        kelasAktif: dosen ? new Set(assignments.map((item) => item.kelasId)).size : null,
                        mahasiswaBimbingan: dosen?._count.mahasiswa ?? null,
                        jadwalMingguan: dosen ? assignments.reduce((total, item) => total + item._count.jadwal, 0) : null,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getLecturerTeach(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const userId = String(req.params.id)

            const tahunAkademikId = Number(
                req.query.tahunAkademikId
            )

            if (!tahunAkademikId) {
                throw {
                    name: "BadRequest",
                    message: "Tahun akademik wajib dipilih",
                }
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    dosen: {
                        select: {
                            id: true,
                        },
                    },
                },
            })

            if (!user || !user.dosen) {
                throw {
                    name: "NotFound",
                    message: "Dosen tidak ditemukan",
                }
            }

            const tahunAkademik =
                await prisma.tahunAkademik.findUnique({
                    where: {
                        id: tahunAkademikId,
                    },
                    select: {
                        id: true,
                        tahun: true,
                        semester: true,
                    },
                })

            if (!tahunAkademik) {
                throw {
                    name: "NotFound",
                    message: "Tahun akademik tidak ditemukan",
                }
            }

            const kelasMataKuliahs =
                await prisma.kelasMataKuliah.findMany({
                    where: {
                        dosenId: user.dosen.id,

                        jadwal: {
                            some: {
                                tahunAkademikId,
                            },
                        },
                    },

                    select: {
                        id: true,

                        mataKuliah: {
                            select: {
                                kode: true,
                                nama: true,
                                sks: true,
                            },
                        },

                        kelas: {
                            select: {
                                nama: true,
                            },
                        },

                        jadwal: {
                            where: {
                                tahunAkademikId,
                            },

                            select: {
                                id: true,
                                hari: true,
                                jamMulai: true,
                                jamSelesai: true,

                                ruangan: {
                                    select: {
                                        nama: true,
                                    },
                                },
                            },

                            orderBy: [
                                {
                                    hari: "asc",
                                },
                                {
                                    jamMulai: "asc",
                                },
                            ],
                        },
                    },
                })

            const mengajar =
                kelasMataKuliahs.map((item) => ({
                    id: item.id,

                    kode:
                        item.mataKuliah.kode,

                    mataKuliah:
                        item.mataKuliah.nama,

                    kelas:
                        item.kelas.nama,

                    sks:
                        item.mataKuliah.sks,

                    jadwal:
                        item.jadwal.map((jadwal) => ({
                            id: jadwal.id,
                            hari: jadwal.hari,
                            jamMulai: jadwal.jamMulai,
                            jamSelesai: jadwal.jamSelesai,
                            ruangan:
                                jadwal.ruangan.nama,
                        })),
                }))

            return res.status(200).json({
                message:
                    "Data mengajar dosen berhasil diambil",

                data: {
                    tahunAkademik,
                    mengajar,
                },
            })
        } catch (error) {
            next(error)
        }
    }


    static async getLecturerSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const rawYearId = req.query.tahunAkademikId;
            const tahunAkademikId = typeof rawYearId === "string" ? Number(rawYearId) : NaN;

            if (typeof id !== "string" || !id.trim()) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "ID user dosen wajib diisi",
                });
            }
            if (typeof rawYearId !== "string" || !/^\d+$/.test(rawYearId) ||
                !Number.isSafeInteger(tahunAkademikId) || tahunAkademikId <= 0) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "tahunAkademikId wajib berupa bilangan bulat positif",
                });
            }

            const user = await prisma.user.findUnique({
                where: { id, role: "Dosen" },
                select: { dosen: { select: { id: true } } },
            });
            if (!user?.dosen) {
                throw { name: "NotFound", message: "Dosen tidak ditemukan" };
            }

            const tahunAkademik = await prisma.tahunAkademik.findUnique({
                where: { id: tahunAkademikId },
                select: { id: true, tahun: true, semester: true },
            });
            if (!tahunAkademik) {
                throw { name: "NotFound", message: "Tahun akademik tidak ditemukan" };
            }

            const schedules = await prisma.jadwal.findMany({
                where: {
                    tahunAkademikId,
                    kelasMataKuliah: { dosenId: user.dosen.id },
                },
                select: {
                    id: true,
                    hari: true,
                    jamMulai: true,
                    jamSelesai: true,
                    kelasMataKuliah: {
                        select: {
                            mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
                            kelas: { select: { id: true, nama: true } },
                        },
                    },
                    ruangan: { select: { id: true, kode: true, nama: true } },
                },
            });

            // Jangan bergantung pada hariUrutan karena kolom tersebut nullable.
            const hariUrutan: Record<string, number> = {
                SENIN: 1, SELASA: 2, RABU: 3, KAMIS: 4, JUMAT: 5, SABTU: 6, MINGGU: 7,
            };
            const jadwal = schedules
                .sort((a, b) => hariUrutan[a.hari] - hariUrutan[b.hari] ||
                    a.jamMulai.localeCompare(b.jamMulai) || a.id - b.id)
                .map((item) => ({
                    id: item.id,
                    hari: item.hari,
                    jamMulai: item.jamMulai,
                    jamSelesai: item.jamSelesai,
                    mataKuliah: item.kelasMataKuliah.mataKuliah,
                    kelas: item.kelasMataKuliah.kelas,
                    ruangan: item.ruangan,
                }));

            return res.status(200).json({
                message: "Jadwal dosen berhasil diambil",
                data: { tahunAkademik, jadwal },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAdvisees(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = String(req.params.id)

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : ""

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    )

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    )

    const skip = (page - 1) * limit

    // Find lecturer by User ID
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        dosen: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user || !user.dosen) {
      throw {
        name: "NotFound",
        message: "Lecturer not found",
      }
    }

    const lecturerId = user.dosen.id

    const requestedYear = req.query.tahunAkademikId
    if (requestedYear !== undefined && (
      typeof requestedYear !== "string" || !/^\d+$/.test(requestedYear) ||
      !Number.isSafeInteger(Number(requestedYear)) || Number(requestedYear) <= 0
    )) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "tahunAkademikId wajib berupa bilangan bulat positif",
      })
    }

    const tahunAkademik = requestedYear !== undefined
      ? await prisma.tahunAkademik.findUnique({
          where: { id: Number(requestedYear) }, select: { id: true },
        })
      : await prisma.tahunAkademik.findFirst({
          where: { isActive: true },
          orderBy: [{ tahun: "desc" }, { id: "desc" }],
          select: { id: true },
        })
    if (!tahunAkademik) {
      throw { name: "NotFound", message: "Tahun akademik tidak ditemukan" }
    }

    const where: Prisma.MahasiswaWhereInput = {
      dosenId: lecturerId,

      ...(search && {
        OR: [
          {
            nim: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    }

    const [students, totalRows, total, krsCounts] =
      await Promise.all([
        prisma.mahasiswa.findMany({
          where,

          skip,
          take: limit,

          select: {
            id: true,
            nim: true,
            angkatan: true,
            status: true,

            krs: {
              where: { tahunAkademikId: tahunAkademik.id },
              select: { status: true },
            },

            user: {
              select: {
                id: true,
                name: true,
              },
            },

            prodi: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            nim: "asc",
          },
        }),

        prisma.mahasiswa.count({
          where,
        }),
        prisma.mahasiswa.count({ where: { dosenId: lecturerId } }),
        prisma.kRS.groupBy({
          by: ["status"],
          where: {
            tahunAkademikId: tahunAkademik.id,
            mahasiswa: { dosenId: lecturerId },
          },
          _count: { _all: true },
        }),
      ])

    const totalPages = Math.ceil(
      totalRows / limit
    )

    const countStatus = (status: string) =>
      krsCounts.find((item) => item.status === status)?._count._all ?? 0
    const approved = countStatus("DISETUJUI")
    const pending = countStatus("DIAJUKAN")
    const rejected = countStatus("DITOLAK")
    const summary = {
      total,
      approved,
      pending,
      notSubmitted: total - approved - pending - rejected,
      rejected,
    }
    const krsStatusLabels = {
      DRAFT: "BELUM_DIAJUKAN",
      DIAJUKAN: "MENUNGGU",
      DISETUJUI: "DISETUJUI",
      DITOLAK: "DITOLAK",
    }

    const advisees = students.map(
      (student) => ({
        id: student.user.id,
        studentId: student.id,
        nim: student.nim,
        name: student.user.name,

        studyProgram: {
          id: student.prodi.id,
          name: student.prodi.name,
        },

        cohort: student.angkatan,
        studentStatus: student.status.toUpperCase(),
        krsStatus: student.krs[0]
          ? krsStatusLabels[student.krs[0].status]
          : "BELUM_DIAJUKAN",
      })
    )

    return res.status(200).json({
      message: "Advisees retrieved successfully",

      data: {
        summary,
        advisees,

        pagination: {
          page,
          limit,
          totalRows,
          totalPages,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

}
