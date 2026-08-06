// import { JabatanDosen, Role, Status } from "";
import { JabatanDosen, Role, Status } from "@prisma/client";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/bycript";

async function main() {
  console.log("🌱 Seeding database...");

  const password = hashPassword("Tasik123");

  // ==========================
  // Admin
  // ==========================
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@siakad.com",
      username: "admin",
      password,
      role: Role.Admin,
      gender: "Male",
      phoneNumber: "081111111111",
      address: "Tasikmalaya",
    },
  });

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
    const fakultas = await prisma.fakultas.create({
      data: { kode: fakultasDef.kode, name: fakultasDef.name },
    });

    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const prodi = await prisma.prodi.create({
        data: {
          kode: `${fakultasDef.kode}${pIdx + 1}`, // e.g. FT1, FT2, ... unik per prodi
          name: prodiNamesPerFakultas[fIdx][pIdx],
          fakultasId: fakultas.id,
        },
      });

      // ==========================
      // 10 Dosen untuk prodi ini (5 prodi x 10 = 50 dosen per fakultas)
      // ==========================
      const createdDosenInProdi: string[] = []; // simpan id dosen, dipakai buat assign mahasiswa

      for (let d = 0; d < 10; d++) {
        const idx = dosenGlobalIndex; // 0..249, unik sepanjang seluruh seed
        const first = firstNames[idx % firstNames.length];
        const last = lastNames[idx % lastNames.length];

        const userDosen = await prisma.user.create({
          data: {
            name: `Dr. ${first} ${last}`,
            email: `dosen${idx}@siakad.com`,
            username: `dosen${idx}`,
            password, // sudah di-hash, konsisten dengan admin & mahasiswa
            role: Role.Dosen,
            gender: idx % 2 === 0 ? "Male" : "Female",
            phoneNumber: `082${String(idx).padStart(9, "0")}`,
            address: cities[idx % cities.length],
          },
        });

        const dosenRecord = await prisma.dosen.create({
          data: {
            nidn: String(100000000 + idx), // unik per idx, 9 digit
            status: Status.Aktif,
            jabatan: JabatanDosen.Dosen,
            userId: userDosen.id,
            prodiId: prodi.id,
          },
        });

        createdDosenInProdi.push(dosenRecord.id);
        dosenGlobalIndex++;
      }

      // ==========================
      // 10 Mahasiswa untuk prodi ini (5 prodi x 10 = 50 mahasiswa per fakultas)
      // ==========================
      for (let m = 0; m < 10; m++) {
        const idx = mahasiswaGlobalIndex; // 0..249, unik sepanjang seluruh seed

        const user = await prisma.user.create({
          data: {
            name: `Mahasiswa ${idx + 1}`,
            email: `mahasiswa${idx}@student.com`,
            username: `mahasiswa${idx}`,
            password,
            gender: idx % 2 === 0 ? "Female" : "Male",
            role: Role.Mahasiswa,
            phoneNumber: `08120000${String(idx).padStart(4, "0")}`,
            address: `Alamat Mahasiswa ${idx + 1}`,
          },
        });

        // dosen wali diambil round-robin dari 10 dosen di prodi yang sama
        const dosenId = createdDosenInProdi[m % createdDosenInProdi.length];

        await prisma.mahasiswa.create({
          data: {
            nim: `2024${String(idx).padStart(6, "0")}`, // unik per idx, tidak bentrok antar prodi/fakultas
            angkatan: 2024,
            semester: 2,
            status: Status.Aktif,
            userId: user.id,
            prodiId: prodi.id,
            dosenId,
          },
        });

        mahasiswaGlobalIndex++;
      }
    }
  }

  console.log(`✅ Seed selesai: 5 fakultas, 25 prodi, ${dosenGlobalIndex} dosen, ${mahasiswaGlobalIndex} mahasiswa`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });