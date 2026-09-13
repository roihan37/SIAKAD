import { Hari } from "@prisma/client";
import { integer, text } from "./master-data";

export const stringId = text("ID", 100);
const time = (value: unknown): string => {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw { name: "BadRequest", message: "Waktu harus berformat HH:mm (00:00–23:59)." };
  }
  return value;
};
const day = (value: unknown): Hari => {
  if (typeof value !== "string" || !Object.values(Hari).includes(value as Hari)) {
    throw { name: "BadRequest", message: "Hari tidak valid." };
  }
  return value as Hari;
};
export const jadwalPatch = {
  kelasMataKuliahId: integer("Kelas mata kuliah"), tahunAkademikId: integer("Tahun akademik"),
  ruanganId: integer("Ruangan"), hari: day, jamMulai: time, jamSelesai: time,
};
export const krsPatch = { mahasiswaId: stringId, tahunAkademikId: integer("Tahun akademik") };
