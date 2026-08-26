/*
  Warnings:

  - You are about to drop the column `mataKuliahId` on the `Kurikulum` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `Kurikulum` table. All the data in the column will be lost.
  - You are about to drop the column `wajib` on the `Kurikulum` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prodiId,kode]` on the table `Kurikulum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prodiId,tahun]` on the table `Kurikulum` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `Kurikulum` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `Kurikulum` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahun` to the `Kurikulum` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Kurikulum` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Kurikulum" DROP CONSTRAINT "Kurikulum_mataKuliahId_fkey";

-- DropForeignKey
ALTER TABLE "Kurikulum" DROP CONSTRAINT "Kurikulum_prodiId_fkey";

-- DropIndex
DROP INDEX "Kurikulum_prodiId_mataKuliahId_key";

-- AlterTable
ALTER TABLE "Kurikulum" DROP COLUMN "mataKuliahId",
DROP COLUMN "semester",
DROP COLUMN "wajib",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kode" TEXT NOT NULL,
ADD COLUMN     "nama" TEXT NOT NULL,
ADD COLUMN     "tahun" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "KurikulumMataKuliah" (
    "id" SERIAL NOT NULL,
    "kurikulumId" INTEGER NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "wajib" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KurikulumMataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeKRS" (
    "id" SERIAL NOT NULL,
    "tahunAkademikId" INTEGER NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PeriodeKRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KurikulumToProdi" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_KurikulumToProdi_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "KurikulumMataKuliah_kurikulumId_mataKuliahId_key" ON "KurikulumMataKuliah"("kurikulumId", "mataKuliahId");

-- CreateIndex
CREATE INDEX "_KurikulumToProdi_B_index" ON "_KurikulumToProdi"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_prodiId_kode_key" ON "Kurikulum"("prodiId", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_prodiId_tahun_key" ON "Kurikulum"("prodiId", "tahun");

-- AddForeignKey
ALTER TABLE "KurikulumMataKuliah" ADD CONSTRAINT "KurikulumMataKuliah_kurikulumId_fkey" FOREIGN KEY ("kurikulumId") REFERENCES "Kurikulum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KurikulumMataKuliah" ADD CONSTRAINT "KurikulumMataKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodeKRS" ADD CONSTRAINT "PeriodeKRS_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KurikulumToProdi" ADD CONSTRAINT "_KurikulumToProdi_A_fkey" FOREIGN KEY ("A") REFERENCES "Kurikulum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KurikulumToProdi" ADD CONSTRAINT "_KurikulumToProdi_B_fkey" FOREIGN KEY ("B") REFERENCES "Prodi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
