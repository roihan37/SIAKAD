/*
  Warnings:

  - You are about to drop the `_KurikulumToProdi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_KurikulumToProdi" DROP CONSTRAINT "_KurikulumToProdi_A_fkey";

-- DropForeignKey
ALTER TABLE "_KurikulumToProdi" DROP CONSTRAINT "_KurikulumToProdi_B_fkey";

-- DropTable
DROP TABLE "_KurikulumToProdi";

-- AddForeignKey
ALTER TABLE "Kurikulum" ADD CONSTRAINT "Kurikulum_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
