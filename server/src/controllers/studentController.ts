import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/bycript";
import { Prisma } from "@prisma/client";
import { AvatarService } from "../services/avatar.service";
import { S3Service } from "../services/s3.service";

export class Controller {

    static async createStudent(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        const {
            name, email, username, password, phoneNumber, gender, address,
            nim, angkatan, semester, status, prodiId, birthDate, avatarKey, dosenId
        } = req.body
        try {

            // console.log(req.body);
            const hash = await hashPassword(password)
            let avatarUrl: string | undefined;

            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
            }

            const newUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name,
                        email,
                        username,
                        password: hash,
                        birthDate,
                        role: "Mahasiswa",
                        phoneNumber,
                        gender,
                        address,
                        avatarKey,
                        avatarUrl
                    }
                })

                await tx.mahasiswa.create({
                    data: {
                        nim,
                        angkatan,
                        semester,
                        status,
                        prodiId,
                        userId: user.id,
                        dosenId
                    }
                })
                return user
            })

            // console.log(newUser, '<< NEW USERS');

            res.status(201).json({
                message: `${newUser.name} created successfully`
            })

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

            next(error)
        }
    }

    static async updateStudentById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const {
                name,
                email,
                username,
                password,
                phoneNumber,
                gender,
                address,
                nik,
                birthPlace,
                nim,
                angkatan,
                semester,
                status,
                prodiId,
                birthDate,
                avatarKey,
                dosenId
            } = req.body



            const existingUser = await prisma.user.findUnique({
                where: { id: id as string },
                include: { mahasiswa: true },
            });

            if (!existingUser) throw { name: "NotFound", message: "User tidak ditemukan" };
            if (!existingUser.mahasiswa) throw { name: "BadRequest", message: "User ini bukan mahasiswa" };

            let avatarUrl: string | undefined;
            let oldAvatarKey: string | null = null;

            if (avatarKey) {
                await AvatarService.verifyKey(avatarKey);
                avatarUrl = AvatarService.getPublicUrl(avatarKey);
                oldAvatarKey = existingUser.avatarKey; // simpan referensi foto lama untuk dihapus setelah update sukses
            }

            const hash = password ? await hashPassword(password) : existingUser.password;

            const userUpdate = await prisma.user.update({
                where: { id: id as string },
                data: {
                    name,
                    email,
                    username,
                    password: hash,
                    birthDate,
                    phoneNumber,
                    gender,
                    address,
                    nik,
                    birthPlace,
                    ...(avatarKey ? { avatarKey, avatarUrl } : {}),
                    mahasiswa: {
                        update: {
                            nim,
                            angkatan,
                            semester,
                            status,
                            prodiId,
                            dosenId,
                        },
                    },
                },
                include: {
                    mahasiswa: true, // opsional: biar response langsung bawa data mahasiswa terbaru
                },
            });

            if (oldAvatarKey) {
                await S3Service.deleteUrl(oldAvatarKey)
            }

            res.status(200).json({
                message: "User berhasil diperbarui",
                data: userUpdate.id,
            });
        } catch (error) {
            next(error)
        }
    }

    static async deleteUserById(req: Request, res: Response, next: NextFunction) {
        try {

        } catch (error) {

        }
    }

    // STUDENTS
    static async getAllStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";


            const skip = (page - 1) * limit;

            const where: Prisma.UserWhereInput = {
                role: "Mahasiswa",
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                            { mahasiswa: { nim: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                        ],
                    }
                    : {}),
            };

            const sortableFields: Record<string, Prisma.UserOrderByWithRelationInput> = {
                name: { name: sortOrder },
                nim: { mahasiswa: { nim: sortOrder } },
                semester: { mahasiswa: { semester: sortOrder } },
            };

            const orderBy = sortableFields[sortBy] ?? { name: sortOrder };


            const [students, totalRows] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        mahasiswa: {
                            select: {
                                id: true,
                                nim: true,
                                status: true,
                                semester: true,
                                prodi: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            res.status(200).json({
                students,
                pagination: {
                    page,
                    limit,
                    totalRows,
                    totalPages: Math.max(1, Math.ceil(totalRows / limit)),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { id } = req.params;

            const student = await prisma.user.findFirst({
                where: {
                    id: id as string,
                    role: "Mahasiswa",
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    address: true,
                    birthDate: true,
                    gender: true,
                    nik: true,
                    birthPlace: true,
                    mahasiswa: {
                        select: {
                            id: true,
                            nim: true,
                            angkatan: true,
                            semester: true,
                            status: true,
                            prodi: {
                                select: {
                                    id: true,
                                    name: true,
                                    fakultas: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                    kurikulum: {
                                        where: {
                                            isActive: true,
                                        },
                                        orderBy: {
                                            tahun: "desc",
                                        },
                                        take: 1,
                                        select: {
                                            id: true,
                                            kode: true,
                                            nama: true,
                                            tahun: true,
                                        },
                                    },
                                },
                            },
                            dosen: {
                                select: {
                                    id: true,
                                    user: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                            krs: {
                                select: {
                                    tahunAkademik: {
                                        select: {
                                            tahun: true,
                                            semester: true,
                                        },
                                    },
                                    details: {
                                        select: {
                                            kelasMataKuliah: {
                                                select: {
                                                    mataKuliah: {
                                                        select: {
                                                            sks: true,
                                                        },
                                                    },
                                                },
                                            },
                                            transkrip: {
                                                select: {
                                                    bobot: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!student || !student.mahasiswa) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswa = student.mahasiswa;
            const jenisKelamin = student.gender === "Male" ? "L" : student.gender === "Female" ? "P" : null;
            const tanggalLahir = student.birthDate
                ? new Date(student.birthDate).toISOString().split("T")[0]
                : null;
            const semesterOrder = {
                GANJIL: 1,
                GENAP: 2,
            } as const;
            const getStartYear = (tahun: string) => Number(tahun.split("/")[0]);
            const round = (value: number) => Math.round(value * 100) / 100;

            const gradedDetails = mahasiswa.krs.flatMap((krs) =>
                krs.details
                    .filter((detail) => detail.transkrip[0]?.bobot != null)
                    .map((detail) => ({
                        sks: detail.kelasMataKuliah.mataKuliah.sks,
                        bobot: Number(detail.transkrip[0]!.bobot),
                    }))
            );
            const totalSKS = gradedDetails.reduce((total, detail) => total + detail.sks, 0);
            const totalGradePoints = gradedDetails.reduce(
                (total, detail) => total + detail.sks * detail.bobot,
                0
            );
            const semester = mahasiswa.krs.reduce((latest, krs) => {
                const currentSemester =
                    (getStartYear(krs.tahunAkademik.tahun) - mahasiswa.angkatan) * 2 +
                    semesterOrder[krs.tahunAkademik.semester];
                return Math.max(latest, currentSemester);
            }, mahasiswa.semester);

            console.log(mahasiswa.prodi?.kurikulum[0], "<< KURIKULUM TERAKHIR");
            res.status(200).json({
                student: {
                    id: student.id,
                    nim: mahasiswa.nim,
                    nama: student.name,
                    nik: student.nik ?? null,
                    tempatLahir: student.birthPlace ?? null,
                    tanggalLahir,
                    jenisKelamin,
                    email: student.email,
                    noHp: student.phoneNumber ?? null,
                    alamat: student.address ?? null,
                    angkatan: mahasiswa.angkatan,
                    prodi: mahasiswa.prodi
                        ? {
                            id: mahasiswa.prodi.id,
                            nama: mahasiswa.prodi.name,
                        }
                        : null,
                    fakultas: mahasiswa.prodi?.fakultas
                        ? {
                            id: mahasiswa.prodi.fakultas.id,
                            nama: mahasiswa.prodi.fakultas.name,
                        }
                        : null,
                    kurikulum: mahasiswa.prodi?.kurikulum[0]
                        ? {
                            id: mahasiswa.prodi.kurikulum[0].id,
                            kode: mahasiswa.prodi.kurikulum[0].kode,
                            nama: mahasiswa.prodi.kurikulum[0].nama,
                            tahun: mahasiswa.prodi.kurikulum[0].tahun,
                        }
                        : null,
                    dosenPembimbing: mahasiswa.dosen?.user
                        ? {
                            id: mahasiswa.dosen.id,
                            nama: mahasiswa.dosen.user.name,
                        }
                        : null,
                    summary: {
                        ipk: totalSKS > 0 ? round(totalGradePoints / totalSKS) : 0,
                        totalSKS,
                        semester,
                        kehadiran: null,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentSemesterHistory(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID yang dikirim FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User sekaligus relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                            angkatan: true,
                        },
                    },
                },
            });

            if (!user || user.role !== "Mahasiswa" || !user.mahasiswa) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswaId = user.mahasiswa.id;
            const angkatan = user.mahasiswa.angkatan;

            // ==========================================
            // 2. Ambil seluruh KRS mahasiswa
            // ==========================================
            const krsRows = await prisma.kRS.findMany({
                where: {
                    mahasiswaId,
                },
                select: {
                    id: true,
                    status: true,

                    tahunAkademik: {
                        select: {
                            id: true,
                            tahun: true,
                            semester: true,
                        },
                    },

                    details: {
                        select: {
                            id: true,

                            kelasMataKuliah: {
                                select: {
                                    mataKuliah: {
                                        select: {
                                            sks: true,
                                        },
                                    },
                                },
                            },

                            transkrip: {
                                where: {
                                    mahasiswaId,
                                },
                                select: {
                                    bobot: true,
                                },
                            },
                        },
                    },
                },
            });

            // ==========================================
            // 3. Urutan semester
            // ==========================================
            const semesterOrder = {
                GANJIL: 1,
                GENAP: 2,
            } as const;

            // ==========================================
            // 4. Ambil tahun awal akademik
            // Contoh:
            // "2024/2025" -> 2024
            // ==========================================
            const getStartYear = (tahun: string) => {
                return Number(tahun.split("/")[0]);
            };

            // ==========================================
            // 5. Hitung semester mahasiswa
            //
            // Angkatan 2024:
            // 2024/2025 Ganjil -> 1
            // 2024/2025 Genap  -> 2
            // 2025/2026 Ganjil -> 3
            // 2025/2026 Genap  -> 4
            // ==========================================
            const getSemesterNumber = (
                tahun: string,
                semester: keyof typeof semesterOrder
            ) => {
                const startYear = getStartYear(tahun);

                return (
                    (startYear - angkatan) * 2 +
                    semesterOrder[semester]
                );
            };

            // ==========================================
            // 6. Pembulatan
            // ==========================================
            const round = (value: number) => {
                return Math.round(value * 100) / 100;
            };

            // ==========================================
            // 7. Sort KRS berdasarkan tahun + semester
            // ==========================================
            const orderedKrsRows = [...krsRows].sort((a, b) => {
                const yearA = getStartYear(
                    a.tahunAkademik.tahun
                );

                const yearB = getStartYear(
                    b.tahunAkademik.tahun
                );

                if (yearA !== yearB) {
                    return yearA - yearB;
                }

                return (
                    semesterOrder[a.tahunAkademik.semester] -
                    semesterOrder[b.tahunAkademik.semester]
                );
            });

            // ==========================================
            // 8. Variable untuk IPK kumulatif
            // ==========================================
            let cumulativeSks = 0;
            let cumulativeGradePoints = 0;

            // ==========================================
            // 9. Build riwayat semester
            // ==========================================
            const riwayatSemester = orderedKrsRows.map((krs) => {
                // Hanya mata kuliah yang sudah memiliki bobot
                const gradedDetails = krs.details.filter(
                    (detail) =>
                        detail.transkrip[0]?.bobot != null
                );

                // Total SKS semester
                const sks = gradedDetails.reduce(
                    (total, detail) => {
                        return (
                            total +
                            detail.kelasMataKuliah.mataKuliah.sks
                        );
                    },
                    0
                );

                // Total nilai berbobot
                const gradePoints = gradedDetails.reduce(
                    (total, detail) => {
                        const bobot = Number(
                            detail.transkrip[0]!.bobot
                        );

                        const sks =
                            detail.kelasMataKuliah.mataKuliah.sks;

                        return total + bobot * sks;
                    },
                    0
                );

                // ==========================================
                // Update nilai kumulatif
                // ==========================================
                cumulativeSks += sks;
                cumulativeGradePoints += gradePoints;

                // ==========================================
                // IPS
                // ==========================================
                const ips =
                    sks > 0
                        ? round(gradePoints / sks)
                        : 0;

                // ==========================================
                // IPK
                // ==========================================
                const ipk =
                    cumulativeSks > 0
                        ? round(
                            cumulativeGradePoints /
                            cumulativeSks
                        )
                        : 0;

                // ==========================================
                // Label semester
                // ==========================================
                const labelSemester =
                    krs.tahunAkademik.semester === "GANJIL"
                        ? "Ganjil"
                        : "Genap";

                return {
                    semester: getSemesterNumber(
                        krs.tahunAkademik.tahun,
                        krs.tahunAkademik.semester
                    ),

                    tahunAkademik: {
                        id: krs.tahunAkademik.id,
                        tahun: krs.tahunAkademik.tahun,
                        semester: krs.tahunAkademik.semester,
                        label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                    },

                    sks,

                    ips,

                    ipk,

                    status:
                        krs.status === "DISETUJUI"
                            ? "SELESAI"
                            : krs.status,
                };
            });

            // console.log(riwayatSemester, "<< RIWAYAT SEMESTER");
            return res.status(200).json({
                riwayatSemester,
            });
        } catch (error) {
            console.error(error);
            next(error);
        }
    }

    static async getStudentKRS(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID dari FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User dan relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (
                !user ||
                user.role !== "Mahasiswa" ||
                !user.mahasiswa
            ) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswaId = user.mahasiswa.id;

            // ==========================================
            // 2. Validate tahunAkademikId
            // ==========================================
            const tahunAkademikIdParam =
                req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw {
                    name: "BadRequest",
                    message: "tahunAkademikId wajib diisi",
                };
            }

            const tahunAkademikId =
                Number(tahunAkademikIdParam);

            if (
                !Number.isInteger(tahunAkademikId) ||
                tahunAkademikId <= 0
            ) {
                throw {
                    name: "BadRequest",
                    message:
                        "tahunAkademikId harus berupa angka positif",
                };
            }

            // ==========================================
            // 3. Ambil KRS
            // ==========================================
            const krs = await prisma.kRS.findUnique({
                where: {
                    mahasiswaId_tahunAkademikId: {
                        mahasiswaId,
                        tahunAkademikId,
                    },
                },

                select: {
                    id: true,

                    status: true,

                    tahunAkademik: {
                        select: {
                            id: true,
                            tahun: true,
                            semester: true,
                        },
                    },

                    details: {
                        select: {
                            id: true,
                            status: true,

                            kelasMataKuliah: {
                                select: {
                                    mataKuliah: {
                                        select: {
                                            id: true,
                                            kode: true,
                                            nama: true,
                                            sks: true,
                                        },
                                    },

                                    kelas: {
                                        select: {
                                            id: true,
                                            nama: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            // ==========================================
            // 4. KRS belum tersedia
            // ==========================================
            if (!krs) {
                return res.status(200).json({
                    krs: null,
                });
            }

            // ==========================================
            // 5. Label semester
            // ==========================================
            const labelSemester =
                krs.tahunAkademik.semester === "GANJIL"
                    ? "Ganjil"
                    : "Genap";

            // ==========================================
            // 6. Mapping details
            // ==========================================
            const details = krs.details.map((detail) => ({
                id: detail.id,

                mataKuliah: {
                    id: detail.kelasMataKuliah.mataKuliah.id,
                    kode: detail.kelasMataKuliah.mataKuliah.kode,
                    nama: detail.kelasMataKuliah.mataKuliah.nama,
                    sks: detail.kelasMataKuliah.mataKuliah.sks,
                },

                kelas: {
                    id: detail.kelasMataKuliah.kelas.id,
                    nama: detail.kelasMataKuliah.kelas.nama,
                },

                status: detail.status,
            }));

            // ==========================================
            // 7. Total SKS
            // ==========================================
            const totalSKS = details.reduce(
                (total, detail) =>
                    total + detail.mataKuliah.sks,
                0
            );

            // ==========================================
            // 8. Response
            // ==========================================
            return res.status(200).json({
                krs: {
                    id: krs.id,

                    tahunAkademik: {
                        id: krs.tahunAkademik.id,
                        tahun: krs.tahunAkademik.tahun,
                        semester: krs.tahunAkademik.semester,
                        label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                    },

                    status: krs.status,

                    totalSKS,

                    details,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentNilai(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            // ID dari FE adalah User.id
            const userId = String(req.params.id);

            // ==========================================
            // 1. Cari User dan relasi Mahasiswa
            // ==========================================
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    role: true,
                    mahasiswa: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (
                !user ||
                user.role !== "Mahasiswa" ||
                !user.mahasiswa
            ) {
                throw {
                    name: "NotFound",
                    message: "Mahasiswa tidak ditemukan",
                };
            }

            const mahasiswaId = user.mahasiswa.id;

            // ==========================================
            // 2. Validate tahunAkademikId
            // ==========================================
            const tahunAkademikIdParam =
                req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw {
                    name: "BadRequest",
                    message: "tahunAkademikId wajib diisi",
                };
            }

            const tahunAkademikId =
                Number(tahunAkademikIdParam);

            if (
                !Number.isInteger(tahunAkademikId) ||
                tahunAkademikId <= 0
            ) {
                throw {
                    name: "BadRequest",
                    message:
                        "tahunAkademikId harus berupa angka positif",
                };
            }

            // ==========================================
            // 3. Get KRS semester yang dipilih
            //    + seluruh KRS untuk IPK
            // ==========================================
            const [krs, allKrs] = await Promise.all([
                prisma.kRS.findUnique({
                    where: {
                        mahasiswaId_tahunAkademikId: {
                            mahasiswaId,
                            tahunAkademikId,
                        },
                    },

                    select: {
                        id: true,

                        tahunAkademik: {
                            select: {
                                id: true,
                                tahun: true,
                                semester: true,
                            },
                        },

                        details: {
                            select: {
                                id: true,

                                kelasMataKuliah: {
                                    select: {
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

                                transkrip: {
                                    where: {
                                        mahasiswaId,
                                    },
                                    select: {
                                        nilaiAngka: true,
                                        nilaiHuruf: true,
                                        bobot: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                prisma.kRS.findMany({
                    where: {
                        mahasiswaId,
                    },

                    select: {
                        tahunAkademikId: true,

                        details: {
                            select: {
                                kelasMataKuliah: {
                                    select: {
                                        mataKuliah: {
                                            select: {
                                                sks: true,
                                            },
                                        },
                                    },
                                },

                                transkrip: {
                                    where: {
                                        mahasiswaId,
                                    },
                                    select: {
                                        bobot: true,
                                    },
                                },
                            },
                        },
                    },
                }),
            ]);

            // ==========================================
            // 4. KRS belum tersedia
            // ==========================================
            if (!krs) {
                return res.status(200).json({
                    nilai: null,
                });
            }

            // ==========================================
            // 5. Hanya nilai yang sudah mempunyai bobot
            // ==========================================
            const gradedDetails = krs.details.filter(
                (detail) =>
                    detail.transkrip[0]?.bobot != null
            );

            // ==========================================
            // 6. Mapping nilai
            // ==========================================
            const details = gradedDetails.map((detail) => {
                const transkrip = detail.transkrip[0]!;

                return {
                    id: detail.id,

                    mataKuliah: {
                        id: detail.kelasMataKuliah.mataKuliah.id,
                        kode: detail.kelasMataKuliah.mataKuliah.kode,
                        nama: detail.kelasMataKuliah.mataKuliah.nama,
                        sks: detail.kelasMataKuliah.mataKuliah.sks,
                    },

                    nilai:
                        transkrip.nilaiAngka != null
                            ? Number(transkrip.nilaiAngka)
                            : null,

                    grade: transkrip.nilaiHuruf,

                    bobot:
                        transkrip.bobot != null
                            ? Number(transkrip.bobot)
                            : null,
                };
            });

            // ==========================================
            // 7. Calculate SKS + Grade Points
            // ==========================================
            const calculatePoints = (
                rows: typeof allKrs
            ) => {
                return rows.reduce(
                    (summary, row) => {
                        row.details.forEach((detail) => {
                            const transkrip =
                                detail.transkrip[0];

                            if (transkrip?.bobot == null) {
                                return;
                            }

                            const sks =
                                detail
                                    .kelasMataKuliah
                                    .mataKuliah
                                    .sks;

                            const bobot =
                                Number(transkrip.bobot);

                            summary.sks += sks;
                            summary.points +=
                                bobot * sks;
                        });

                        return summary;
                    },
                    {
                        sks: 0,
                        points: 0,
                    }
                );
            };

            // ==========================================
            // 8. IPS semester yang dipilih
            // ==========================================
            const currentSummary =
                calculatePoints(
                    allKrs.filter(
                        (row) =>
                            row.tahunAkademikId ===
                            tahunAkademikId
                    )
                );

            // ==========================================
            // 9. IPK kumulatif
            // ==========================================
            const cumulativeSummary =
                calculatePoints(allKrs);

            // ==========================================
            // 10. Helper pembulatan
            // ==========================================
            const round = (value: number) =>
                Math.round(value * 100) / 100;

            // ==========================================
            // 11. Label semester
            // ==========================================
            const labelSemester =
                krs.tahunAkademik.semester === "GANJIL"
                    ? "Ganjil"
                    : "Genap";

            // ==========================================
            // 12. Response
            // ==========================================
            return res.status(200).json({
                nilai: {
                    tahunAkademik: {
                        id: krs.tahunAkademik.id,
                        tahun: krs.tahunAkademik.tahun,
                        semester: krs.tahunAkademik.semester,
                        label: `${krs.tahunAkademik.tahun} ${labelSemester}`,
                    },

                    details,

                    summary: {
                        totalSKS: currentSummary.sks,

                        ips:
                            currentSummary.sks > 0
                                ? round(
                                    currentSummary.points /
                                    currentSummary.sks
                                )
                                : 0,

                        ipk:
                            cumulativeSummary.sks > 0
                                ? round(
                                    cumulativeSummary.points /
                                    cumulativeSummary.sks
                                )
                                : 0,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
