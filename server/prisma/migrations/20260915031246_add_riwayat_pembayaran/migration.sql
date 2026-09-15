-- CreateEnum
CREATE TYPE "SumberPembayaran" AS ENUM ('MANUAL', 'PAYMENT_GATEWAY');

-- AlterTable
ALTER TABLE "PembayaranUKT" ADD COLUMN     "sumber" "SumberPembayaran",
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "RiwayatStatusPembayaran" (
    "id" TEXT NOT NULL,
    "pembayaranId" TEXT NOT NULL,
    "statusLama" "StatusPembayaran",
    "statusBaru" "StatusPembayaran" NOT NULL,
    "alasan" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatStatusPembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiwayatStatusPembayaran_pembayaranId_idx" ON "RiwayatStatusPembayaran"("pembayaranId");

-- CreateIndex
CREATE INDEX "RiwayatStatusPembayaran_pembayaranId_createdAt_idx" ON "RiwayatStatusPembayaran"("pembayaranId", "createdAt");

-- CreateIndex
CREATE INDEX "PembayaranUKT_createdAt_idx" ON "PembayaranUKT"("createdAt");

-- AddForeignKey
ALTER TABLE "RiwayatStatusPembayaran" ADD CONSTRAINT "RiwayatStatusPembayaran_pembayaranId_fkey" FOREIGN KEY ("pembayaranId") REFERENCES "PembayaranUKT"("id") ON DELETE CASCADE ON UPDATE CASCADE;
