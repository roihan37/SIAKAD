import { Prisma } from "@prisma/client";

// Menghapus seluruh data aplikasi. Hanya untuk database demo dengan --reset.
export async function resetDatabase(tx: Prisma.TransactionClient) {
  await tx.absensi.deleteMany();
  await tx.pertemuan.deleteMany();
  await tx.transkrip.deleteMany();
  await tx.kRSDetail.deleteMany();
  await tx.kRS.deleteMany();
  await tx.jadwal.deleteMany();
  await tx.kelasMataKuliah.deleteMany();
  await tx.kelas.deleteMany();
  await tx.kurikulumMataKuliah.deleteMany();
  await tx.kurikulum.deleteMany();
  await tx.mataKuliah.deleteMany();
  await tx.riwayatStatusMahasiswa.deleteMany();
  await tx.mahasiswa.deleteMany();
  await tx.dosen.deleteMany();
  await tx.refreshToken.deleteMany();
  await tx.user.deleteMany();
  await tx.prodi.deleteMany();
  await tx.fakultas.deleteMany();
  await tx.periodeKRS.deleteMany();
  await tx.tahunAkademik.deleteMany();
  await tx.ruangan.deleteMany();
}

