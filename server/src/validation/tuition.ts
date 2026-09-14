import { Prisma } from "@prisma/client";
import { integer } from "./master-data";

export function billGenerationBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw { name: "BadRequest", message: "Body harus berupa objek JSON." };
  const input = body as Record<string, unknown>;
  const allowed = ["tahunAkademikId", "prodiId", "angkatan", "nominal", "jatuhTempo"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw { name: "BadRequest", message: "Body mengandung field yang tidak didukung." };
  const tahunAkademikId = integer("Tahun akademik")(input.tahunAkademikId);
  const prodiId = integer("Program studi")(input.prodiId);
  const angkatan = integer("Angkatan", 1900, 9999)(input.angkatan);
  if (!["number", "string"].includes(typeof input.nominal) || !/^\d{1,13}(\.\d{1,2})?$/.test(String(input.nominal))) {
    throw { name: "BadRequest", message: "Nominal harus positif, maksimal 13 digit dengan 2 angka desimal." };
  }
  const nominal = new Prisma.Decimal(String(input.nominal));
  if (!nominal.isPositive() || nominal.isZero()) throw { name: "BadRequest", message: "Nominal harus lebih dari nol." };
  if (typeof input.jatuhTempo !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.jatuhTempo)) {
    throw { name: "BadRequest", message: "Jatuh tempo wajib berformat YYYY-MM-DD." };
  }
  const calendarDate = new Date(`${input.jatuhTempo}T00:00:00Z`);
  if (Number.isNaN(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== input.jatuhTempo) {
    throw { name: "BadRequest", message: "Tanggal jatuh tempo tidak valid." };
  }
  // Berlaku hingga akhir tanggal jatuh tempo di zona waktu kampus.
  const jatuhTempo = new Date(`${input.jatuhTempo}T23:59:59.999+07:00`);
  return { tahunAkademikId, prodiId, angkatan, nominal, jatuhTempo };
}

export function billListQuery(query: Record<string, unknown>) {
  const optionalId = (key: string) => query[key] === undefined ? undefined : integer(key)(query[key]);
  if (query.status !== undefined && !["BELUM_DIBAYAR", "SEBAGIAN", "LUNAS", "JATUH_TEMPO"].includes(query.status as string)) {
    throw { name: "BadRequest", message: "Status tagihan tidak valid." };
  }
  if (query.search !== undefined && (typeof query.search !== "string" || query.search.length > 200)) {
    throw { name: "BadRequest", message: "Search harus berupa teks maksimal 200 karakter." };
  }
  return {
    tahunAkademikId: optionalId("tahunAkademikId"), prodiId: optionalId("prodiId"),
    status: query.status as string | undefined, search: (query.search as string | undefined)?.trim() ?? "",
    page: query.page === undefined ? 1 : integer("page", 1, 1000000)(query.page),
    limit: query.limit === undefined ? 10 : integer("limit", 1, 100)(query.limit),
  };
}
