-- CreateTable
CREATE TABLE "RiwayatStatusMahasiswa" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "statusLama" "Status",
    "statusBaru" "Status" NOT NULL,
    "alasan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiwayatStatusMahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiwayatStatusMahasiswa_mahasiswaId_idx" ON "RiwayatStatusMahasiswa"("mahasiswaId");

-- CreateIndex
CREATE INDEX "RiwayatStatusMahasiswa_mahasiswaId_tanggal_idx" ON "RiwayatStatusMahasiswa"("mahasiswaId", "tanggal");

-- AddForeignKey
ALTER TABLE "RiwayatStatusMahasiswa" ADD CONSTRAINT "RiwayatStatusMahasiswa_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
