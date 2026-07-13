/*
  Warnings:

  - The values [DOSEN,KAPRODI,DEKAN,REKTOR] on the enum `JabatanDosen` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,DOSEN,MAHASISWA] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [AKTIF,CUTI,LULUS,NONAKTIF] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JabatanDosen_new" AS ENUM ('Dosen', 'Kaprodi', 'Dekan', 'Rektor');
ALTER TABLE "public"."Dosen" ALTER COLUMN "jabatan" DROP DEFAULT;
ALTER TABLE "Dosen" ALTER COLUMN "jabatan" TYPE "JabatanDosen_new" USING ("jabatan"::text::"JabatanDosen_new");
ALTER TYPE "JabatanDosen" RENAME TO "JabatanDosen_old";
ALTER TYPE "JabatanDosen_new" RENAME TO "JabatanDosen";
DROP TYPE "public"."JabatanDosen_old";
ALTER TABLE "Dosen" ALTER COLUMN "jabatan" SET DEFAULT 'Dosen';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Admin', 'Dosen', 'Mahasiswa');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('Aktif', 'Cuti', 'Lulus', 'Nonaktif');
ALTER TABLE "Mahasiswa" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "Dosen" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
COMMIT;

-- AlterTable
ALTER TABLE "Dosen" ALTER COLUMN "jabatan" SET DEFAULT 'Dosen';
