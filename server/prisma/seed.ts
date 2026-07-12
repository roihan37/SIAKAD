// import { JabatanDosen, Role, Status } from "";
import { JabatanDosen, Role, Status } from "@prisma/client";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";



// import bcrypt from "bcrypt";



async function main() {
  console.log("🌱 Seeding database...");

  // ==========================
  // Fakultas
  // ==========================
  const fakultas = await prisma.fakultas.create({
    data: {
      kode: "FT",
      nama: "Fakultas Teknik",
    },
  });

  // ==========================
  // Prodi
  // ==========================
  const prodi = await prisma.prodi.create({
    data: {
      kode: "IF",
      nama: "Teknik Informatika",
      fakultasId: fakultas.id,
    },
  });

//   const password = await bcrypt.hash("password123", 10);

  // ==========================
  // Admin
  // ==========================
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@siakad.com",
      username: "admin",
      password : "Tasik123",
      role: Role.ADMIN,
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
      password : "Tasik123",
      role: Role.DOSEN,
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
      status: Status.AKTIF,
      jabatan: JabatanDosen.DOSEN,
      userId: userDosen.id,
      prodiId: prodi.id,
    },
  });

  // ==========================
  // User Mahasiswa
  // ==========================
  const userMahasiswa = await prisma.user.create({
    data: {
      name: "Roihan Salsabila",
      email: "roihan@student.com",
      username: "roihan",
      password : "Tasik123",
      role: Role.MAHASISWA,
      phoneNumber: "083333333333",
      address: "Tasikmalaya",
    },
  });

  // ==========================
  // Mahasiswa
  // ==========================
  await prisma.mahasiswa.create({
    data: {
      nim: "2024001001",
      angkatan: 2024,
      semester: 2,
      status: Status.AKTIF,

      userId: userMahasiswa.id,
      prodiId: prodi.id,
      dosenId: dosen.id,
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });