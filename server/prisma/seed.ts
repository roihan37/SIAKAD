// import { JabatanDosen, Role, Status } from "";
/// <reference types="node" />
import { JabatanDosen, Role, Status, KRSStatus, Hari, Semester } from "@prisma/client";
import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/bycript";
import { S3Service } from "../src/services/s3.service";

async function ensureStudentProfilePhoto(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            avatarKey: true,
        },
    });

    if (!user) {
        return;
    }

    // ==========================================
    // 1. Hapus avatar lama
    // ==========================================
    if (user.avatarKey) {
        try {
            await S3Service.deleteUrl(
                user.avatarKey
            );
        } catch (error) {
            console.warn(
                `Gagal menghapus avatar lama user ${userId}:`,
                error
            );
        }
    }

    // ==========================================
    // 2. File foto
    // ==========================================
    const photoPath = path.resolve(
        __dirname,
        "../data/man-7796384_1280.jpg"
    );

    const fileBuffer = await readFile(
        photoPath
    );

    // ==========================================
    // 3. Generate key
    // ==========================================
    const key =
        `students/${userId}/avatar-${Date.now()}.jpg`;

    // ==========================================
    // 4. Generate presigned upload URL
    // ==========================================
    const uploadUrl =
        await S3Service.createUploadUrl(
            key,
            "image/jpeg"
        );

    // ==========================================
    // 5. Upload ke S3
    // ==========================================
    const uploadResponse = await fetch(
        uploadUrl,
        {
            method: "PUT",
            headers: {
                "Content-Type": "image/jpeg",
            },
            body: fileBuffer,
        }
    );

    // WAJIB cek upload
    if (!uploadResponse.ok) {
        throw new Error(
            `Gagal upload foto ke S3: ${uploadResponse.status} ${uploadResponse.statusText}`
        );
    }

    // ==========================================
    // 6. Simpan KEY saja
    // ==========================================
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            avatarKey: key,
            avatarUrl: null,
        },
    });

    console.log(
        `✅ Foto mahasiswa berhasil diupload: ${userId}`
    );
}

async function main() {
  console.log("🌱 Seeding database...");

  const password = hashPassword("Tasik123");

  // ==========================
  // Admin
  // ==========================
  try {
    await prisma.user.create({ data: { name: "Super Admin", email: "admin@siakad.com", username: "admin", password, role: Role.Admin, gender: "Male", phoneNumber: "081111111111", address: "Tasikmalaya" } });
  } catch (err: any) {
    // ignore duplicate admin (P2002) so seed is idempotent; for other errors
    // (adapter / permission issues) log and continue so the rest of the seed can run.
    if (err?.code === "P2002") {
      console.log("Admin already exists — skipping creation.");
    } else {
      console.warn("Warning: could not create admin record — continuing seed.", err?.message ?? err);
    }
  }

  // ==========================
  // Data generator untuk 5 fakultas x 5 prodi
  // ==========================
  const fakultasDefs = [
    { kode: "FT", name: "Fakultas Teknik" },
    { kode: "FE", name: "Fakultas Ekonomi" },
    { kode: "FH", name: "Fakultas Hukum" },
    { kode: "FIK", name: "Fakultas Ilmu Komputer" },
    { kode: "FIP", name: "Fakultas Ilmu Pendidikan" },
  ];

  // nama prodi generik per fakultas — ganti sesuai kebutuhan nyata kampusmu
  const prodiNamesPerFakultas = [
    ["Teknik Informatika", "Teknik Elektro", "Teknik Sipil", "Teknik Mesin", "Teknik Industri"],
    ["Manajemen", "Akuntansi", "Ekonomi Pembangunan", "Bisnis Digital", "Perbankan Syariah"],
    ["Ilmu Hukum", "Hukum Bisnis", "Hukum Pidana", "Hukum Tata Negara", "Hukum Internasional"],
    ["Sistem Informasi", "Ilmu Komputer", "Teknologi Informasi", "Data Science", "Rekayasa Perangkat Lunak"],
    ["Pendidikan Guru SD", "Bimbingan Konseling", "Pendidikan Bahasa Inggris", "Pendidikan Matematika", "PAUD"],
  ];

  const firstNames = ["Ahmad", "Siti", "Budi", "Rina", "Dedi", "Fitri", "Agus", "Maya", "Hendra", "Dewi"];
  const lastNames = ["Santoso", "Wijaya", "Kusuma", "Pratama", "Hidayat"];
  const cities = ["Bandung", "Jakarta", "Surabaya", "Yogyakarta", "Semarang"];

  let dosenGlobalIndex = 0;    // 0..249, penjamin keunikan nidn/email/username/phone
  let mahasiswaGlobalIndex = 0; // 0..249, penjamin keunikan nim/email/username/phone

  for (let fIdx = 0; fIdx < fakultasDefs.length; fIdx++) {
    const fakultasDef = fakultasDefs[fIdx];
    let fakultas;
    try {
      fakultas = await prisma.fakultas.create({ data: { kode: fakultasDef.kode, name: fakultasDef.name } });
    } catch (err: any) {
      if (err?.code === "P2002") {
        // already exists, load existing by kode
        fakultas = await prisma.fakultas.findUnique({ where: { kode: fakultasDef.kode } });
        if (!fakultas) throw err;
      } else {
        console.warn("Warning: skipping fakultas creation due to error:", err?.message ?? err);
        continue;
      }
    }

    for (let pIdx = 0; pIdx < 5; pIdx++) {
      let prodi;
      const prodiKode = `${fakultasDef.kode}${pIdx + 1}`;
      try {
        prodi = await prisma.prodi.create({ data: { kode: prodiKode, name: prodiNamesPerFakultas[fIdx][pIdx], fakultasId: fakultas.id } });
      } catch (err: any) {
        if (err?.code === "P2002") {
          prodi = await prisma.prodi.findUnique({ where: { kode: prodiKode } });
          if (!prodi) throw err;
        } else {
          console.warn("Warning: skipping prodi creation due to error:", err?.message ?? err);
          continue;
        }
      }

      // ==========================
      // 10 Dosen untuk prodi ini (5 prodi x 10 = 50 dosen per fakultas)
      // ==========================
      const createdDosenInProdi: string[] = []; // simpan id dosen, dipakai buat assign mahasiswa

      for (let d = 0; d < 10; d++) {
        const idx = dosenGlobalIndex; // 0..249, unik sepanjang seluruh seed
        const first = firstNames[idx % firstNames.length];
        const last = lastNames[idx % lastNames.length];

        let userDosen;
        const dosenEmail = `dosen${idx}@siakad.com`;
        try {
          userDosen = await prisma.user.create({
            data: {
              name: `Dr. ${first} ${last}`,
              email: dosenEmail,
              username: `dosen${idx}`,
              password, // sudah di-hash, konsisten dengan admin & mahasiswa
              role: Role.Dosen,
              gender: idx % 2 === 0 ? "Male" : "Female",
              phoneNumber: `082${String(idx).padStart(9, "0")}`,
              address: cities[idx % cities.length],
            },
          });
        } catch (err: any) {
          if (err?.code === "P2002") {
            userDosen = await prisma.user.findUnique({ where: { email: dosenEmail } });
            if (!userDosen) throw err;
          } else {
            throw err;
          }
        }

        // create dosen record (nidn unique) or reuse existing
        const nidnVal = String(100000000 + idx);
        let dosenRecord;
        try {
          dosenRecord = await prisma.dosen.create({ data: { nidn: nidnVal, status: Status.Aktif, jabatan: JabatanDosen.Dosen, userId: userDosen.id, prodiId: prodi.id } });
        } catch (err: any) {
          if (err?.code === "P2002") {
            dosenRecord = await prisma.dosen.findUnique({ where: { nidn: nidnVal } });
            if (!dosenRecord) throw err;
          } else {
            throw err;
          }
        }

        createdDosenInProdi.push(dosenRecord.id);
        dosenGlobalIndex++;
      }

      // ==========================
      // 10 Mahasiswa untuk prodi ini (5 prodi x 10 = 50 mahasiswa per fakultas)
      // ==========================
      for (let m = 0; m < 10; m++) {
        const idx = mahasiswaGlobalIndex; // 0..249, unik sepanjang seluruh seed

        const mahasiswaEmail = `mahasiswa${idx}@student.com`;
        let user;
        try {
          user = await prisma.user.create({ data: { name: `Mahasiswa ${idx + 1}`, email: mahasiswaEmail, username: `mahasiswa${idx}`, password, gender: idx % 2 === 0 ? "Female" : "Male", role: Role.Mahasiswa, phoneNumber: `08120000${String(idx).padStart(4, "0")}`, address: `Alamat Mahasiswa ${idx + 1}` } });
        } catch (err: any) {
          if (err?.code === "P2002") {
            user = await prisma.user.findUnique({ where: { email: mahasiswaEmail } });
            if (!user) throw err;
          } else {
            throw err;
          }
        }

        // dosen wali diambil round-robin dari available createdDosenInProdi
        const dosenId = createdDosenInProdi.length ? createdDosenInProdi[m % createdDosenInProdi.length] : null;

        // create mahasiswa record if not exists
        const nimVal = `2024${String(idx).padStart(6, "0")}`;
        try {
          await prisma.mahasiswa.create({ data: { nim: nimVal, angkatan: 2024, semester: 2, status: Status.Aktif, userId: user.id, prodiId: prodi.id, dosenId } });
        } catch (err: any) {
          if (err?.code === "P2002") {
            // already exists, skip
          } else {
            throw err;
          }
        }

        mahasiswaGlobalIndex++;
      }
    }
  }

  console.log(`✅ Initial seed selesai: 5 fakultas, 25 prodi, ${dosenGlobalIndex} dosen, ${mahasiswaGlobalIndex} mahasiswa`);

  // --- lanjutkan: buat mata kuliah, kurikulum, ruangan, tahun akademik, kelas, penjadwalan, dan KRS

  let allProdi: any[] = [];
  let allDosen: any[] = [];
  let allMahasiswa: any[] = [];
  try {
    allProdi = await prisma.prodi.findMany();
  } catch (err: any) {
    console.warn("Warning: could not load prodi list, continuing with empty list:", err?.message ?? err);
  }
  try {
    allDosen = await prisma.dosen.findMany();
  } catch (err: any) {
    console.warn("Warning: could not load dosen list, continuing with empty list:", err?.message ?? err);
  }
  try {
    allMahasiswa = await prisma.mahasiswa.findMany();
  } catch (err: any) {
    console.warn("Warning: could not load mahasiswa list, continuing with empty list:", err?.message ?? err);
  }

  // Mata kuliah per prodi (8 mata kuliah each)
  // ==========================
  // Mata Kuliah + Kurikulum
  // ==========================

  // const mkTemplates = [
  //   "Pengantar Pemrograman",
  //   "Struktur Data",
  //   "Basis Data",
  //   "Sistem Operasi",
  //   "Jaringan Komputer",
  //   "Rekayasa Perangkat Lunak",
  //   "Analisis dan Desain",
  //   "Kecerdasan Buatan",
  // ];

  // ==========================
  // Mata Kuliah + Kurikulum
  // ==========================

  const mkTemplates = [
    "Pengantar Pemrograman",
    "Struktur Data",
    "Basis Data",
    "Sistem Operasi",
    "Jaringan Komputer",
    "Rekayasa Perangkat Lunak",
    "Analisis dan Desain",
    "Kecerdasan Buatan",
  ];

  const createdMataKuliah: {
    id: number;
    prodiId: number;
  }[] = [];

  for (const p of allProdi) {
    try {
      // =====================================================
      // 1. SATU KURIKULUM UNTUK SATU PRODI DALAM SATU TAHUN
      // =====================================================

      const kurikulum = await prisma.kurikulum.upsert({
        where: {
          prodiId_tahun: {
            prodiId: p.id,
            tahun: 2024,
          },
        },

        update: {
          nama: `Kurikulum ${p.name} 2024`,
          isActive: true,
        },

        create: {
          kode: `${p.kode}-2024`,
          nama: `Kurikulum ${p.name} 2024`,
          tahun: 2024,
          prodiId: p.id,
          isActive: true,
        },
      });

      // =====================================================
      // 2. BUAT 8 MATA KULIAH UNTUK PRODI TERSEBUT
      // =====================================================

      for (
        let i = 0;
        i < mkTemplates.length;
        i++
      ) {
        const kode =
          `${p.kode}-MK${String(i + 1).padStart(2, "0")}`;

        const nama = mkTemplates[i];

        const sks =
          [2, 3, 4][i % 3];

        const semester = i + 1;

        // ===================================================
        // 3. CREATE / GET MATA KULIAH
        // ===================================================

        const mataKuliah =
          await prisma.mataKuliah.upsert({
            where: {
              kode,
            },

            update: {
              nama,
              sks,
            },

            create: {
              kode,
              nama,
              sks,
            },
          });

        // ===================================================
        // 4. HUBUNGKAN MATA KULIAH DENGAN KURIKULUM
        // ===================================================

        await prisma.kurikulumMataKuliah.upsert({
          where: {
            kurikulumId_mataKuliahId: {
              kurikulumId: kurikulum.id,
              mataKuliahId: mataKuliah.id,
            },
          },

          update: {
            semester,
            wajib: true,
          },

          create: {
            kurikulumId: kurikulum.id,
            mataKuliahId: mataKuliah.id,
            semester,
            wajib: true,
          },
        });

        // ===================================================
        // 5. SIMPAN ID UNTUK KELAS MATA KULIAH
        // ===================================================

        createdMataKuliah.push({
          id: mataKuliah.id,
          prodiId: p.id,
        });
      }
    } catch (error: any) {
      console.error(
        `❌ Gagal membuat data kurikulum untuk prodi ${p.kode}:`,
        error?.message ?? error
      );

      throw error;
    }
  }

  // Ruangan (10 rooms)
  const ruanganList = [];
  for (let r = 1; r <= 10; r++) {
    try {
      const kode = `R-${String(r).padStart(2, "0")}`;
      const nama = `Ruang ${String.fromCharCode(64 + r)}`;
      const kapasitas = 30 + (r % 5) * 10;
      const gedung = `Gedung ${Math.ceil(r / 5)}`;
      const ru = await prisma.ruangan.create({ data: { kode, nama, kapasitas, gedung } });
      ruanganList.push(ru);
    } catch (err: any) {
      if (err?.code === "P2002") {
        // skip existing
      } else {
        console.warn("Warning: could not create ruangan:", err?.message ?? err);
      }
    }
  }

  // ==========================
  // Tahun Akademik
  // ==========================

  let ta1: any = null;
  let ta2: any = null;

  try {
    ta1 = await prisma.tahunAkademik.create({
      data: {
        tahun: "2023/2024",
        semester: Semester.GANJIL,
        isActive: false,
      },
    });
  } catch (err: any) {
    if (err?.code !== "P2002") {
      console.warn(
        "Warning: could not create tahun akademik 2023/2024:",
        err?.message ?? err
      );
    }

    ta1 = await prisma.tahunAkademik.findUnique({
      where: {
        tahun_semester: {
          tahun: "2023/2024",
          semester: Semester.GANJIL,
        },
      },
    });
  }

  try {
    ta2 = await prisma.tahunAkademik.create({
      data: {
        tahun: "2024/2025",
        semester: Semester.GENAP,
        isActive: true,
      },
    });
  } catch (err: any) {
    if (err?.code !== "P2002") {
      console.warn(
        "Warning: could not create tahun akademik 2024/2025:",
        err?.message ?? err
      );
    }

    ta2 = await prisma.tahunAkademik.findUnique({
      where: {
        tahun_semester: {
          tahun: "2024/2025",
          semester: Semester.GENAP,
        },
      },
    });
  }

  const activeTA = ta2 ?? ta1;

  // ==========================
  // Periode KRS
  // ==========================

  if (ta1) {
    try {
      await prisma.periodeKRS.create({
        data: {
          tahunAkademikId: ta1.id,
          mulai: new Date("2023-08-01"),
          selesai: new Date("2023-08-15"),
          isActive: false,
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") {
        console.warn(
          "Warning: could not create periode KRS 2023/2024:",
          err?.message ?? err
        );
      }
    }
  }

  if (ta2) {
    try {
      await prisma.periodeKRS.create({
        data: {
          tahunAkademikId: ta2.id,
          mulai: new Date("2025-01-20"),
          selesai: new Date("2025-02-05"),
          isActive: true,
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") {
        console.warn(
          "Warning: could not create periode KRS 2024/2025:",
          err?.message ?? err
        );
      }
    }
  }

  // Kelas per prodi (2 kelas tiap prodi: A & B, tingkat 1)
  const kelasList: any[] = [];
  for (const p of allProdi) {
    try {
      const kelasA = await prisma.kelas.create({ data: { nama: `Kelas A`, prodiId: p.id, tahunAkademikId: activeTA?.id ?? 0, tingkat: 1 } });
      const kelasB = await prisma.kelas.create({ data: { nama: `Kelas B`, prodiId: p.id, tahunAkademikId: activeTA?.id ?? 0, tingkat: 1 } });
      kelasList.push(kelasA, kelasB);
    } catch (err: any) {
      console.warn("Warning: could not create kelas for prodi", p.id, err?.message ?? err);
    }
  }

  // KelasMataKuliah: assign 5 mata kuliah per kelas, pick dosen from same prodi
  const kelasMKList: any[] = [];
  for (const kelas of kelasList) {
    const mksForProdi = createdMataKuliah.filter((m) => m.prodiId === kelas.prodiId).map((m) => m.id);
    const dosenForProdi = allDosen.filter((d) => d.prodiId === kelas.prodiId).map((d) => d.id);
    for (let i = 0; i < Math.min(5, mksForProdi.length); i++) {
      try {
        const mataKuliahId = mksForProdi[i];
        const dosenId = dosenForProdi[i % Math.max(1, dosenForProdi.length)];
        const km = await prisma.kelasMataKuliah.create({ data: { kelasId: kelas.id, mataKuliahId, dosenId } });
        kelasMKList.push(km);
      } catch (err: any) {
        console.warn("Warning: could not create kelasMataKuliah for kelas", kelas.id, err?.message ?? err);
      }
    }
  }

  // Jadwal: schedule each kelasMK into a ruangan and time slot
  const hariValues = [
    Hari.SENIN,
    Hari.SELASA,
    Hari.RABU,
    Hari.KAMIS,
    Hari.JUMAT,
  ];

  const hariUrutan: Record<Hari, number> = {
    [Hari.SENIN]: 1,
    [Hari.SELASA]: 2,
    [Hari.RABU]: 3,
    [Hari.KAMIS]: 4,
    [Hari.JUMAT]: 5,
    [Hari.SABTU]: 6
  };

  for (let i = 0; i < kelasMKList.length; i++) {
    const km = kelasMKList[i];
    const ru = ruanganList[i % ruanganList.length];
    const hari = hariValues[i % hariValues.length];

    const jamMulai =
  `${String(8 + (i % 6)).padStart(2, "0")}:00`;

const jamSelesai =
  `${String(9 + (i % 6)).padStart(2, "0")}:30`;

    try {
      await prisma.jadwal.create({
        data: {
          kelasMataKuliahId: km.id,
          tahunAkademikId: activeTA?.id ?? 0,
          ruanganId: ru.id,

          hari,
          hariUrutan: hariUrutan[hari],

          jamMulai,
          jamSelesai,
        },
      });
    }
    catch (err: any) {
      console.warn("Warning: could not create jadwal for kelasMK", km.id, err?.message ?? err);
    }
  }

  // KRS: buat KRS untuk setiap mahasiswa pada tahun akademik aktif, dan tambahkan 4 mata kuliah (krs detail)
  for (const m of allMahasiswa) {
    try {
      const krs = await prisma.kRS.create({ data: { mahasiswaId: m.id, tahunAkademikId: activeTA?.id ?? 0 } });
      // pilih kelasMK yang cocok untuk mahasiswa berdasarkan prodi
      const kelasMKForProdi = kelasMKList.filter((km) => {
        // need to fetch kelas to check prodiId; kelasList holds kelas objects
        return kelasList.some((k) => k.id === km.kelasId && k.prodiId === m.prodiId);
      });
      const pick = kelasMKForProdi.slice(0, 4);
      for (const km of pick) {
        try {
          await prisma.kRSDetail.create({ data: { krsId: krs.id, kelasMataKuliahId: km.id, status: KRSStatus.MENUNGGU } });
        } catch (err: any) {
          console.warn("Warning: could not create krs detail for krs", krs.id, err?.message ?? err);
        }
      }
    } catch (err: any) {
      console.warn("Warning: could not create KRS for mahasiswa", m.id, err?.message ?? err);
    }
  }

  // Data akademik realistis khusus untuk Mahasiswa 1
  const mahasiswaPertama = await prisma.mahasiswa.findUnique({
    where: { nim: "2024000000" },
  });

  if (mahasiswaPertama) {
    await prisma.user.update({
      where: { id: mahasiswaPertama.userId },
      data: {
        nik: "3278011508010001",
        birthPlace: "Tasikmalaya",
        birthDate: new Date("2001-08-15T00:00:00.000Z"),
      },
    });

    await ensureStudentProfilePhoto(mahasiswaPertama.userId);

    const krsLama = await prisma.kRS.findMany({
      where: {
        mahasiswaId: mahasiswaPertama.id,
        tahunAkademik: {
          tahun: "2023/2024",
        },
      },
      select: {
        id: true,
        details: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const krs of krsLama) {
      const detailIds = krs.details.map((detail) => detail.id);
      await prisma.transkrip.deleteMany({
        where: { krsDetailId: { in: detailIds } },
      });
      await prisma.kRSDetail.deleteMany({
        where: { krsId: krs.id },
      });
      await prisma.kRS.delete({
        where: { id: krs.id },
      });
    }

    const periodeMahasiswaPertama = [
      { tahun: "2024/2025", semester: Semester.GANJIL },
      { tahun: "2024/2025", semester: Semester.GENAP },
      { tahun: "2025/2026", semester: Semester.GANJIL },
    ];

    const tahunAkademikMahasiswaPertama = [];
    for (const periode of periodeMahasiswaPertama) {
      const tahunAkademik = await prisma.tahunAkademik.upsert({
        where: {
          tahun_semester: periode,
        },
        update: {},
        create: {
          ...periode,
          isActive: false,
        },
      });

      tahunAkademikMahasiswaPertama.push(tahunAkademik);
    }

    const mataKuliahMahasiswaPertama = createdMataKuliah
      .filter((mataKuliah) => mataKuliah.prodiId === mahasiswaPertama.prodiId)
      .slice(0, 4);
    const dosenMahasiswaPertama = allDosen.find(
      (dosen) => dosen.prodiId === mahasiswaPertama.prodiId
    );

    if (mataKuliahMahasiswaPertama.length === 4 && dosenMahasiswaPertama) {
      const nilaiPerSemester = [
        [85, 80, 88, 82],
        [78, 86, 90, 84],
        [92, 88, 85, 90],
      ];
      const gradePerSemester = [
        ["A", "A-", "A", "A-"],
        ["B+", "A-", "A", "A-"],
        ["A", "A", "A-", "A"],
      ];
      const bobotPerGrade: Record<string, number> = {
        A: 4.0,
        "A-": 3.7,
        "B+": 3.3,
      };

      for (let semesterIndex = 0; semesterIndex < tahunAkademikMahasiswaPertama.length; semesterIndex++) {
        const tahunAkademik = tahunAkademikMahasiswaPertama[semesterIndex];
        const kelas = await prisma.kelas.upsert({
          where: {
            nama_prodiId_tahunAkademikId: {
              nama: "Kelas Mahasiswa 1",
              prodiId: mahasiswaPertama.prodiId,
              tahunAkademikId: tahunAkademik.id,
            },
          },
          update: {},
          create: {
            nama: "Kelas Mahasiswa 1",
            prodiId: mahasiswaPertama.prodiId,
            tahunAkademikId: tahunAkademik.id,
            tingkat: semesterIndex + 1,
          },
        });

        const krs = await prisma.kRS.upsert({
          where: {
            mahasiswaId_tahunAkademikId: {
              mahasiswaId: mahasiswaPertama.id,
              tahunAkademikId: tahunAkademik.id,
            },
          },
          update: { status: "DISETUJUI" },
          create: {
            mahasiswaId: mahasiswaPertama.id,
            tahunAkademikId: tahunAkademik.id,
            status: "DISETUJUI",
          },
        });

        for (let courseIndex = 0; courseIndex < mataKuliahMahasiswaPertama.length; courseIndex++) {
          const mataKuliahId = mataKuliahMahasiswaPertama[courseIndex].id;
          const kelasMataKuliah = await prisma.kelasMataKuliah.upsert({
            where: {
              kelasId_mataKuliahId: {
                kelasId: kelas.id,
                mataKuliahId,
              },
            },
            update: {},
            create: {
              kelasId: kelas.id,
              mataKuliahId,
              dosenId: dosenMahasiswaPertama.id,
            },
          });

          const detail = await prisma.kRSDetail.upsert({
            where: {
              krsId_kelasMataKuliahId: {
                krsId: krs.id,
                kelasMataKuliahId: kelasMataKuliah.id,
              },
            },
            update: { status: KRSStatus.DISETUJUI },
            create: {
              krsId: krs.id,
              kelasMataKuliahId: kelasMataKuliah.id,
              status: KRSStatus.DISETUJUI,
            },
          });

          const grade = gradePerSemester[semesterIndex][courseIndex];
          await prisma.transkrip.upsert({
            where: {
              mahasiswaId_krsDetailId: {
                mahasiswaId: mahasiswaPertama.id,
                krsDetailId: detail.id,
              },
            },
            update: {
              nilaiAngka: nilaiPerSemester[semesterIndex][courseIndex],
              nilaiHuruf: grade,
              bobot: bobotPerGrade[grade],
            },
            create: {
              mahasiswaId: mahasiswaPertama.id,
              krsDetailId: detail.id,
              nilaiAngka: nilaiPerSemester[semesterIndex][courseIndex],
              nilaiHuruf: grade,
              bobot: bobotPerGrade[grade],
            },
          });
        }
      }
    }
  }

  console.log("✅ Full seed selesai: created mata kuliah, kurikulum, ruangan, tahun akademik, kelas, kelas-mata-kuliah, jadwal, dan KRS.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });