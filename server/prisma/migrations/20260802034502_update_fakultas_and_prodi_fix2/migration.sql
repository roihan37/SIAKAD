/*
  Warnings:

  - You are about to drop the column `nama` on the `Fakultas` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `Prodi` table. All the data in the column will be lost.
  - Added the required column `name` to the `Fakultas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Prodi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fakultas" DROP COLUMN "nama",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Prodi" DROP COLUMN "nama",
ADD COLUMN     "name" TEXT NOT NULL;
