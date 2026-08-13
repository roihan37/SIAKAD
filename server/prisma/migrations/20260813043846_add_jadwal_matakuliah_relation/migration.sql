-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "Hari" AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU');

-- CreateTable
CREATE TABLE "Jadwal" (
    "id" SERIAL NOT NULL,
    "kelasMataKuliahId" INTEGER NOT NULL,
    "tahunAkademikId" INTEGER NOT NULL,
    "ruanganId" INTEGER NOT NULL,
    "hari" "Hari" NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KelasMataKuliah" (
    "id" SERIAL NOT NULL,
    "kelasId" INTEGER NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "dosenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KelasMataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "tahunAkademikId" INTEGER NOT NULL,
    "tingkat" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kurikulum" (
    "id" SERIAL NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "wajib" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Kurikulum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruangan" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "gedung" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TahunAkademik" (
    "id" SERIAL NOT NULL,
    "tahun" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TahunAkademik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Jadwal_hari_jamMulai_idx" ON "Jadwal"("hari", "jamMulai");

-- CreateIndex
CREATE INDEX "Jadwal_kelasMataKuliahId_idx" ON "Jadwal"("kelasMataKuliahId");

-- CreateIndex
CREATE INDEX "Jadwal_ruanganId_idx" ON "Jadwal"("ruanganId");

-- CreateIndex
CREATE UNIQUE INDEX "KelasMataKuliah_kelasId_mataKuliahId_key" ON "KelasMataKuliah"("kelasId", "mataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_prodiId_tahunAkademikId_key" ON "Kelas"("nama", "prodiId", "tahunAkademikId");

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_prodiId_mataKuliahId_key" ON "Kurikulum"("prodiId", "mataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "MataKuliah_kode_key" ON "MataKuliah"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Ruangan_kode_key" ON "Ruangan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "TahunAkademik_tahun_semester_key" ON "TahunAkademik"("tahun", "semester");

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_kelasMataKuliahId_fkey" FOREIGN KEY ("kelasMataKuliahId") REFERENCES "KelasMataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "Ruangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kurikulum" ADD CONSTRAINT "Kurikulum_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kurikulum" ADD CONSTRAINT "Kurikulum_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
