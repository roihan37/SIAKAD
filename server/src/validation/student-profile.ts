import { Gender } from "@prisma/client";
import { patchBody, text } from "./master-data";

export interface StudentProfileUpdateInput {
  email?: string;
  phoneNumber?: string | null;
  address?: string | null;
  birthPlace?: string | null;
  birthDate?: Date | null;
  gender?: Gender;
}

function invalid(message: string): never {
  throw { name: "BadRequest", message };
}

const nullableText = (label: string, max: number) => (value: unknown): string | null => {
  if (value === null || value === "") return null;
  return text(label, max)(value);
};

function email(value: unknown): string {
  const parsed = text("Email", 254)(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed)) invalid("Email tidak valid.");
  return parsed;
}

function birthDate(value: unknown): Date | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid("birthDate harus menggunakan format YYYY-MM-DD.");
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    invalid("birthDate tidak valid.");
  }
  if (parsed > new Date()) invalid("birthDate tidak boleh di masa depan.");
  return parsed;
}

function gender(value: unknown): Gender {
  if (value !== Gender.Male && value !== Gender.Female) {
    invalid(`gender harus ${Gender.Male} atau ${Gender.Female}.`);
  }
  return value;
}

export function studentProfilePatch(body: unknown): StudentProfileUpdateInput {
  return patchBody(body, {
    email,
    phoneNumber: nullableText("Nomor telepon", 50),
    address: nullableText("Alamat", 2000),
    birthPlace: nullableText("Tempat lahir", 255),
    birthDate,
    gender,
  });
}

export function studentAvatarPatch(body: unknown): { avatarKey: string | null } {
  return patchBody(body, {
    avatarKey: (value: unknown) => value === null ? null : text("avatarKey", 1024)(value),
  }) as { avatarKey: string | null };
}
