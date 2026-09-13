/** Validation shared by master-data PATCH/PUT and DELETE endpoints. */
function invalid(message: string): never { throw { name: "BadRequest", message }; }

type Parser<T> = (value: unknown) => T;
export function integer(label: string, min = 1, max = 2147483647): Parser<number> {
  return (value) => {
    if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value.trim()))) invalid(`${label} harus berupa bilangan bulat.`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) invalid(`${label} harus antara ${min} dan ${max}.`);
    return parsed;
  };
}
export const resourceId = integer("ID");
export const text = (label: string, max = 255): Parser<string> => (value) => {
  if (typeof value !== "string" || !value.trim()) invalid(`${label} wajib diisi.`);
  if (value.trim().length > max) invalid(`${label} maksimal ${max} karakter.`);
  return value.trim();
};
export const nullableText = (label: string): Parser<string | null> => (value) => value === null || value === "" ? null : text(label)(value);
export const boolean: Parser<boolean> = (value) => {
  if (typeof value !== "boolean") invalid("isActive harus berupa boolean true atau false.");
  return value;
};
export const semester: Parser<"GANJIL" | "GENAP"> = (value) => {
  if (value !== "GANJIL" && value !== "GENAP") invalid("Semester harus GANJIL atau GENAP.");
  return value;
};
export const academicYear: Parser<string> = (value) => {
  const year = text("Tahun akademik")(value);
  const match = /^(\d{4})\/(\d{4})$/.exec(year);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) invalid("Tahun akademik harus berurutan, contoh 2026/2027.");
  return year;
};

export function patchBody<S extends Record<string, Parser<unknown>>>(body: unknown, schema: S): { [K in keyof S]?: ReturnType<S[K]> } {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid("Body harus berupa objek JSON.");
  const entries = Object.entries(body);
  if (!entries.length) invalid("Minimal satu field harus diperbarui.");
  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (!Object.prototype.hasOwnProperty.call(schema, key)) invalid(`Field ${key} tidak didukung.`);
    result[key] = schema[key](value);
  }
  return result as { [K in keyof S]?: ReturnType<S[K]> };
}

export function ensureUnused(counts: Record<string, number>, message: string) {
  if (Object.values(counts).some((count) => count > 0)) throw { name: "Conflict", message };
}

export const prodiPatch = { kode: text("Kode prodi", 50), name: text("Nama prodi"), fakultasId: integer("Fakultas") };
export const matkulPatch = { kode: text("Kode mata kuliah", 50), nama: text("Nama mata kuliah"), sks: integer("SKS") };
export const ruanganPatch = { kode: text("Kode ruangan", 50), nama: text("Nama ruangan"), kapasitas: integer("Kapasitas"), gedung: nullableText("Gedung") };
export const tahunAkademikPatch = { tahun: academicYear, semester, isActive: boolean };
export const kurikulumPatch = { kode: text("Kode kurikulum", 50), nama: text("Nama kurikulum"), prodiId: integer("Program studi"), tahun: integer("Tahun kurikulum", 1900, 9999), isActive: boolean };
