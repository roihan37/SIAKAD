import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { seedCampus } from "./seed-data/campus";
import { ensureProfilePhoto } from "./seed-data/photo";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed demo tidak boleh dijalankan pada production.");
  const targets = await seedCampus(process.argv.includes("--reset"));
  if (process.argv.includes("--photos")) for (const target of targets) await ensureProfilePhoto(target.userId, target.entity);
  console.log("Seed selesai: 2 fakultas, 2 prodi, 6 dosen, 16 mahasiswa, 24 mata kuliah, 4 kelas, 24 jadwal. Tahun aktif: 2026/2027 GANJIL.");
  console.log("Login demo: admin / dosen0 / mahasiswa0. Password mengikuti SEED_PASSWORD, default Tasik123.");
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
