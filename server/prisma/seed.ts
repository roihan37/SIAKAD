// import { JabatanDosen, Role, Status } from "";
/// <reference types="node" />
import { JabatanDosen, Role, Status, KRSStatus, Hari, Semester } from "@prisma/client";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/bycript";

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
  const mkTemplates = ["Pengantar Pemrograman","Struktur Data","Basis Data","Sistem Operasi","Jaringan Komputer","Rekayasa Perangkat Lunak","Analisis dan Desain","Kecerdasan Buatan"];
  const createdMataKuliah: { id: number; prodiId: number }[] = [];

  for (const p of allProdi) {
    for (let i = 0; i < mkTemplates.length; i++) {
      try {
        const kode = `${p.kode}-MK${String(i + 1).padStart(2, "0")}`;
        const nama = mkTemplates[i];
        const sks = [2,3,4][i % 3];
        const mk = await prisma.mataKuliah.create({ data: { kode, nama, sks } });
        // buat relasi kurikulum (prodi -> mata kuliah), tempatkan di semester 1..8 round-robin
        const semester = (i % 8) + 1;
        try {
          await prisma.kurikulum.create({ data: { prodiId: p.id, mataKuliahId: mk.id, semester } });
        } catch (err: any) {
          if (err?.code !== "P2002") console.warn("Warning: could not create kurikulum:", err?.message ?? err);
        }
        createdMataKuliah.push({ id: mk.id, prodiId: p.id });
      } catch (err: any) {
        if (err?.code === "P2002") {
          // already exists, ignore
        } else {
          console.warn("Warning: could not create mata kuliah, skipping:", err?.message ?? err);
        }
      }
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

  // Tahun Akademik (2 entries)
  let ta1: any = null;
  let ta2: any = null;
  try {
    ta1 = await prisma.tahunAkademik.create({ data: { tahun: "2023/2024", semester: Semester.GANJIL } });
  } catch (err: any) {
    if (err?.code !== "P2002") console.warn("Warning: could not create tahun akademik 2023/2024:", err?.message ?? err);
  }
  try {
    ta2 = await prisma.tahunAkademik.create({ data: { tahun: "2024/2025", semester: Semester.GENAP } });
  } catch (err: any) {
    if (err?.code !== "P2002") console.warn("Warning: could not create tahun akademik 2024/2025:", err?.message ?? err);
  }
  const activeTA = ta2 ?? ta1;

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
  const hariValues = [Hari.SENIN, Hari.SELASA, Hari.RABU, Hari.KAMIS, Hari.JUMAT];
  for (let i = 0; i < kelasMKList.length; i++) {
    const km = kelasMKList[i];
    const ru = ruanganList[i % ruanganList.length];
    const hari = hariValues[i % hariValues.length];
    const jamMulai = `${8 + (i % 6)}:00`;
    const jamSelesai = `${9 + (i % 6)}:30`;
    try {
      await prisma.jadwal.create({ data: { kelasMataKuliahId: km.id, tahunAkademikId: activeTA?.id ?? 0, ruanganId: ru.id, hari, jamMulai, jamSelesai } });
    } catch (err: any) {
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