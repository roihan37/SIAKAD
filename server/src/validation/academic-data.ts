import { Hari } from "@prisma/client";
import { integer, text, patchBody } from "./master-data";

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

export function studentKrsDraft(body: unknown): { kelasMataKuliahIds: number[] } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw { name: "BadRequest", message: "Body harus berupa objek JSON." };
  }
  const entries = Object.entries(body);
  if (entries.length !== 1 || entries[0][0] !== "kelasMataKuliahIds") {
    throw { name: "BadRequest", message: "Body hanya boleh berisi kelasMataKuliahIds." };
  }
  const value = entries[0][1];
  if (!Array.isArray(value)) {
    throw { name: "BadRequest", message: "kelasMataKuliahIds harus berupa array." };
  }
  return {
    kelasMataKuliahIds: value.map((id) => integer("Kelas mata kuliah")(id)),
  };
}

export function jadwalCreate(body: unknown) {
  const parsed = patchBody(body, jadwalPatch);
  return {
    kelasMataKuliahId: jadwalPatch.kelasMataKuliahId(parsed.kelasMataKuliahId),
    tahunAkademikId: jadwalPatch.tahunAkademikId(parsed.tahunAkademikId),
    ruanganId: jadwalPatch.ruanganId(parsed.ruanganId),
    hari: jadwalPatch.hari(parsed.hari),
    jamMulai: jadwalPatch.jamMulai(parsed.jamMulai),
    jamSelesai: jadwalPatch.jamSelesai(parsed.jamSelesai),
  };
}
