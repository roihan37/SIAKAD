-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateEnum
CREATE TYPE "StatusPertemuan" AS ENUM ('BELUM_DIMULAI', 'BERLANGSUNG', 'SELESAI');

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "pertemuanId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "status" "StatusKehadiran" NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pertemuan" (
    "id" TEXT NOT NULL,
    "jadwalId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "pertemuan" INTEGER NOT NULL,
    "topik" TEXT,
    "status" "StatusPertemuan" NOT NULL DEFAULT 'BELUM_DIMULAI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pertemuan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absensi_mahasiswaId_idx" ON "Absensi"("mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_pertemuanId_mahasiswaId_key" ON "Absensi"("pertemuanId", "mahasiswaId");

-- CreateIndex
CREATE INDEX "Pertemuan_jadwalId_idx" ON "Pertemuan"("jadwalId");

-- CreateIndex
CREATE UNIQUE INDEX "Pertemuan_jadwalId_pertemuan_key" ON "Pertemuan"("jadwalId", "pertemuan");

-- CreateIndex
CREATE UNIQUE INDEX "Pertemuan_jadwalId_tanggal_key" ON "Pertemuan"("jadwalId", "tanggal");

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_pertemuanId_fkey" FOREIGN KEY ("pertemuanId") REFERENCES "Pertemuan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
