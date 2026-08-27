/*
  Warnings:

  - A unique constraint covering the columns `[prodiId,kode]` on the table `Kurikulum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prodiId,tahun]` on the table `Kurikulum` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Kurikulum_kode_key";

-- DropIndex
DROP INDEX "Kurikulum_tahun_key";

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_prodiId_kode_key" ON "Kurikulum"("prodiId", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_prodiId_tahun_key" ON "Kurikulum"("prodiId", "tahun");
