import { getSeedEnv } from "../src/config/env";
import { prisma } from "../src/lib/prisma";
import { seedCampus } from "./seed-data/campus";

async function main() {
  if (getSeedEnv().NODE_ENV === "production") throw new Error("Seed demo tidak boleh dijalankan pada production.");
  // Validate optional storage configuration before any seed writes.
  const photos = process.argv.includes("--photos") ? await import("./seed-data/photo") : undefined;
  const proofs = process.argv.includes("--payment-proofs") ? await import("./seed-data/payment-proof") : undefined;
  const targets = await seedCampus(process.argv.includes("--reset"));
  if (photos) for (const target of targets) await photos.ensureProfilePhoto(target.userId, target.entity);
  if (proofs) await proofs.seedPaymentProof();
  console.log("Seed selesai: 2 fakultas, 2 prodi, 6 dosen, 17 mahasiswa (termasuk 1 akun trial), 24 mata kuliah, 4 kelas, 24 jadwal. Tahun aktif: 2026/2027 GANJIL.");
  console.log("Login demo: admin / dosen0 / mahasiswa0. Password mengikuti konfigurasi seed; nilainya tidak ditampilkan.");
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
