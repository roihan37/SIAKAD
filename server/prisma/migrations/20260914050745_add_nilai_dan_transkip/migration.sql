-- CreateEnum
CREATE TYPE "StatusNilai" AS ENUM ('BELUM_LENGKAP', 'FINAL');

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "krsDetailId" TEXT NOT NULL,
    "tugas" DECIMAL(5,2),
    "uts" DECIMAL(5,2),
    "uas" DECIMAL(5,2),
    "nilaiAkhir" DECIMAL(5,2),
    "grade" TEXT,
    "bobot" DECIMAL(3,2),
    "status" "StatusNilai" NOT NULL DEFAULT 'BELUM_LENGKAP',
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatKoreksiNilai" (
    "id" TEXT NOT NULL,
    "nilaiId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "nilaiAkhirLama" DECIMAL(5,2),
    "nilaiAkhirBaru" DECIMAL(5,2),
    "alasan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatKoreksiNilai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nilai_krsDetailId_key" ON "Nilai"("krsDetailId");

-- CreateIndex
CREATE INDEX "Nilai_status_idx" ON "Nilai"("status");

-- CreateIndex
CREATE INDEX "RiwayatKoreksiNilai_nilaiId_idx" ON "RiwayatKoreksiNilai"("nilaiId");

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_krsDetailId_fkey" FOREIGN KEY ("krsDetailId") REFERENCES "KRSDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKoreksiNilai" ADD CONSTRAINT "RiwayatKoreksiNilai_nilaiId_fkey" FOREIGN KEY ("nilaiId") REFERENCES "Nilai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
