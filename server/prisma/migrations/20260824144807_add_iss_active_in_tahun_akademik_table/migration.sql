-- CreateEnum
CREATE TYPE "KRSStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- AlterTable
ALTER TABLE "TahunAkademik" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KRSDetail" (
    "id" TEXT NOT NULL,
    "krsId" TEXT NOT NULL,
    "kelasMataKuliahId" INTEGER NOT NULL,
    "status" "KRSStatus" NOT NULL DEFAULT 'MENUNGGU',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRSDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRS" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tahunAkademikId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transkrip" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "krsDetailId" TEXT NOT NULL,
    "nilaiAngka" DECIMAL(5,2),
    "nilaiHuruf" TEXT,
    "bobot" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transkrip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KRSDetail_krsId_kelasMataKuliahId_key" ON "KRSDetail"("krsId", "kelasMataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "KRS_mahasiswaId_tahunAkademikId_key" ON "KRS"("mahasiswaId", "tahunAkademikId");

-- CreateIndex
CREATE UNIQUE INDEX "Transkrip_mahasiswaId_krsDetailId_key" ON "Transkrip"("mahasiswaId", "krsDetailId");

-- AddForeignKey
ALTER TABLE "KRSDetail" ADD CONSTRAINT "KRSDetail_krsId_fkey" FOREIGN KEY ("krsId") REFERENCES "KRS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRSDetail" ADD CONSTRAINT "KRSDetail_kelasMataKuliahId_fkey" FOREIGN KEY ("kelasMataKuliahId") REFERENCES "KelasMataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transkrip" ADD CONSTRAINT "Transkrip_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transkrip" ADD CONSTRAINT "Transkrip_krsDetailId_fkey" FOREIGN KEY ("krsDetailId") REFERENCES "KRSDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
