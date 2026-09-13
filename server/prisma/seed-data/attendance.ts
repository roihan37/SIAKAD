import { Prisma, StatusKehadiran, StatusPertemuan } from "@prisma/client";

export function attendanceDate(start: string, meeting: number, time: string) {
  const date = new Date(`${start}T${time}:00+07:00`);
  date.setUTCDate(date.getUTCDate() + (meeting - 1) * 7);
  return date;
}

// Jadwal yang dipilih adalah dua mata kuliah hari Senin per prodi.
export async function seedAttendance(tx: Prisma.TransactionClient, scheduleIds: number[]) {
  const schedules = await tx.jadwal.findMany({
    where: { id: { in: scheduleIds } },
    include: { tahunAkademik: true, kelasMataKuliah: { include: { mataKuliah: true } } },
    orderBy: { id: "asc" },
  });
  for (const schedule of schedules) {
    const historical = schedule.tahunAkademik.tahun === "2025/2026";
    const students = await tx.mahasiswa.findMany({
      where: { krs: { some: {
        tahunAkademikId: schedule.tahunAkademikId,
        status: "DISETUJUI",
        details: { some: { kelasMataKuliahId: schedule.kelasMataKuliahId, status: "DISETUJUI" } },
      } } },
      select: { id: true }, orderBy: { nim: "asc" },
    });
    for (let meeting = 1; meeting <= 2; meeting++) {
      const data = {
        tanggal: attendanceDate(historical ? "2026-02-16" : "2026-09-14", meeting, schedule.jamMulai),
        topik: `${meeting === 1 ? "Pengantar dan kontrak perkuliahan" : "Konsep dasar dan latihan"}: ${schedule.kelasMataKuliah.mataKuliah.nama}`,
        status: historical ? StatusPertemuan.SELESAI : StatusPertemuan.BELUM_DIMULAI,
      };
      const session = await tx.pertemuan.upsert({
        where: { jadwalId_pertemuan: { jadwalId: schedule.id, pertemuan: meeting } },
        update: data,
        create: { jadwalId: schedule.id, pertemuan: meeting, ...data },
      });
      // Hilangkan data lama pada pertemuan seed agar peserta tetap sesuai KRS.
      await tx.absensi.deleteMany({ where: { pertemuanId: session.id } });
      if (!historical) continue;
      for (const [index, student] of students.entries()) {
        const status = meeting === 1 ? StatusKehadiran.HADIR
          : index === 2 ? StatusKehadiran.IZIN
          : index === 4 ? StatusKehadiran.SAKIT
          : index === 6 ? StatusKehadiran.ALPHA : StatusKehadiran.HADIR;
        await tx.absensi.create({ data: {
          pertemuanId: session.id, mahasiswaId: student.id, status,
          keterangan: status === "IZIN" ? "Izin keperluan keluarga, disetujui dosen."
            : status === "SAKIT" ? "Sakit, surat keterangan diterima."
            : status === "ALPHA" ? "Tidak hadir tanpa keterangan." : null,
        } });
      }
    }
  }
}
