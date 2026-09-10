-- CreateEnum
CREATE TYPE "Pendidikan" AS ENUM ('D3', 'D4', 'S1', 'S2', 'S3');

-- AlterTable
ALTER TABLE "Dosen" ADD COLUMN     "bidangKeahlian" TEXT,
ADD COLUMN     "pendidikanTerakhir" "Pendidikan";
