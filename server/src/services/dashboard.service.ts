import { Hari } from "@prisma/client";

type Schedule = { id: number; hari: Hari; jamMulai: string; jamSelesai: string; ruanganId: number; kelasMataKuliah: { kelasId: number; dosenId: string } };

// Satu pasangan dihitung sekali, meskipun bentrok pada dosen sekaligus ruangan.
export function countScheduleConflicts(schedules: Schedule[]): number {
  const sorted = [...schedules].sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (a.hari !== b.hari || b.jamMulai >= a.jamSelesai) break;
      if (a.jamMulai < b.jamSelesai && (a.ruanganId === b.ruanganId ||
          a.kelasMataKuliah.kelasId === b.kelasMataKuliah.kelasId ||
          a.kelasMataKuliah.dosenId === b.kelasMataKuliah.dosenId)) count++;
    }
  }
  return count;
}

export function jakartaWeekday(date = new Date()): Hari | null {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Jakarta" }).format(date);
  const days: Record<string, Hari> = { Monday: Hari.SENIN, Tuesday: Hari.SELASA, Wednesday: Hari.RABU, Thursday: Hari.KAMIS, Friday: Hari.JUMAT, Saturday: Hari.SABTU };
  return days[day] ?? null;
}
