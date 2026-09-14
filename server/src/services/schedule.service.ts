import { Prisma, Hari } from "@prisma/client";

type ScheduleInput = { kelasMataKuliahId: number; tahunAkademikId: number; ruanganId: number; hari: Hari; jamMulai: string; jamSelesai: string };

export async function validateSchedule(tx: Prisma.TransactionClient, data: ScheduleInput, excludeId?: number) {
        if (data.jamMulai >= data.jamSelesai) throw { name: "BadRequest", message: "Jam selesai harus setelah jam mulai." };
        const assignment = await tx.kelasMataKuliah.findUnique({
          where: { id: data.kelasMataKuliahId }, include: { kelas: true },
        });
        if (!assignment) throw { name: "NotFound", message: "Kelas mata kuliah tidak ditemukan." };
        if (!await tx.tahunAkademik.findUnique({ where: { id: data.tahunAkademikId } })) throw { name: "NotFound", message: "Tahun akademik tidak ditemukan." };
        if (assignment.kelas.tahunAkademikId !== data.tahunAkademikId) throw { name: "BadRequest", message: "Tahun akademik jadwal harus sesuai dengan kelas." };
        if (!await tx.ruangan.findUnique({ where: { id: data.ruanganId } })) throw { name: "NotFound", message: "Ruangan tidak ditemukan." };
        const conflict = await tx.jadwal.findFirst({ where: {
          ...(excludeId === undefined ? {} : { id: { not: excludeId } }), tahunAkademikId: data.tahunAkademikId, hari: data.hari,
          jamMulai: { lt: data.jamSelesai }, jamSelesai: { gt: data.jamMulai },
          OR: [
            { ruanganId: data.ruanganId },
            { kelasMataKuliah: { dosenId: assignment.dosenId } },
            { kelasMataKuliah: { kelasId: assignment.kelasId } },
          ],
        }, select: { id: true } });
        if (conflict) throw { name: "Conflict", message: "Jadwal bentrok dengan ruangan, dosen, atau kelas pada waktu yang sama." };
}
