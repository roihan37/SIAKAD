-- CreateEnum
CREATE TYPE "StatusTagihan" AS ENUM ('BELUM_DIBAYAR', 'SEBAGIAN', 'LUNAS', 'JATUH_TEMPO');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('TRANSFER_BANK', 'VIRTUAL_ACCOUNT', 'CASH');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PembayaranUKT" (
    "id" TEXT NOT NULL,
    "tagihanId" TEXT NOT NULL,
    "nomorPembayaran" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "metode" "MetodePembayaran" NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "buktiPembayaranKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PembayaranUKT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagihanUKT" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tahunAkademikId" INTEGER NOT NULL,
    "nomorTagihan" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "jatuhTempo" TIMESTAMP(3) NOT NULL,
    "status" "StatusTagihan" NOT NULL DEFAULT 'BELUM_DIBAYAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagihanUKT_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PembayaranUKT_nomorPembayaran_key" ON "PembayaranUKT"("nomorPembayaran");

-- CreateIndex
CREATE INDEX "PembayaranUKT_tagihanId_idx" ON "PembayaranUKT"("tagihanId");

-- CreateIndex
CREATE INDEX "PembayaranUKT_status_idx" ON "PembayaranUKT"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TagihanUKT_nomorTagihan_key" ON "TagihanUKT"("nomorTagihan");

-- CreateIndex
CREATE INDEX "TagihanUKT_tahunAkademikId_idx" ON "TagihanUKT"("tahunAkademikId");

-- CreateIndex
CREATE INDEX "TagihanUKT_status_idx" ON "TagihanUKT"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TagihanUKT_mahasiswaId_tahunAkademikId_key" ON "TagihanUKT"("mahasiswaId", "tahunAkademikId");

-- AddForeignKey
ALTER TABLE "PembayaranUKT" ADD CONSTRAINT "PembayaranUKT_tagihanId_fkey" FOREIGN KEY ("tagihanId") REFERENCES "TagihanUKT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagihanUKT" ADD CONSTRAINT "TagihanUKT_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagihanUKT" ADD CONSTRAINT "TagihanUKT_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
