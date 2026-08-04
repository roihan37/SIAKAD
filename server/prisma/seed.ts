// import { JabatanDosen, Role, Status } from "";
import { JabatanDosen, Role, Status } from "@prisma/client";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/bycript";



// import bcrypt from "bcrypt";



async function main() {
  console.log("🌱 Seeding database...");

  // ==========================
  // Fakultas
  // ==========================
  const fakultas = await prisma.fakultas.create({
    data: {
      kode: "FT",
      name: "Fakultas Teknik",
    },
  });

  // ==========================
  // Prodi
  // ==========================
  const prodi = await prisma.prodi.create({
    data: {
      kode: "IF",
      name: "Teknik Informatika",
      fakultasId: fakultas.id,
    },
  });

  const password = hashPassword("Tasik123");

  // ==========================
  // Admin
  // ==========================
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@siakad.com",
      username: "admin",
      password: password,
      role: Role.Admin,
      gender: "Male",
      phoneNumber: "081111111111",
      address: "Tasikmalaya",
    },
  });

  // ==========================
  // User Dosen
  // ==========================
  const userDosen = await prisma.user.create({
    data: {
      name: "Dr. Budi Santoso",
      email: "budi@siakad.com",
      username: "budi",
      password: "Tasik123",
      role: Role.Dosen,
      gender: "Male",
      phoneNumber: "082222222222",
      address: "Bandung",
    },
  });

  // ==========================
  // Dosen
  // ==========================
  const dosen = await prisma.dosen.create({
    data: {
      nidn: "0123456789",
      status: Status.Aktif,
      jabatan: JabatanDosen.Dosen,
      userId: userDosen.id,
      prodiId: prodi.id,
    },
  });

  // ==========================
  // Users & Mahasiswa
  // ==========================
  const defaultPassword = hashPassword("Tasik123");

  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Mahasiswa ${i}`,
        email: `mahasiswa${i}@student.com`,
        username: `mahasiswa${i}`,
        password: defaultPassword,
        gender: i % 2 === 0 ? "Female" : "Male",
        role: Role.Mahasiswa,
        phoneNumber: `08120000${String(i).padStart(4, "0")}`,
        address: `Alamat Mahasiswa ${i}`,
      },
    });

    await prisma.mahasiswa.create({
      data: {
        nim: `202400${String(i).padStart(4, "0")}`,
        angkatan: 2024,
        semester: 2,
        status: Status.Aktif,
        userId: user.id,
        prodiId: prodi.id,
        dosenId: dosen.id,
      },
    });
  }

  console.log("✅ 50 Mahasiswa seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });