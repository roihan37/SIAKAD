import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { S3Service } from "../s3.service";
import type { StudentProfileUpdateInput } from "../../validation/student-profile";

const profileSelect = {
  name: true,
  email: true,
  username: true,
  role: true,
  phoneNumber: true,
  nik: true,
  address: true,
  birthDate: true,
  birthPlace: true,
  gender: true,
  avatarKey: true,
  mahasiswa: {
    select: {
      nim: true,
      angkatan: true,
      semester: true,
      status: true,
      prodi: {
        select: {
          id: true,
          kode: true,
          name: true,
          fakultas: {
            select: { id: true, kode: true, name: true },
          },
          kurikulum: {
            where: { isActive: true },
            orderBy: { tahun: "desc" as const },
            take: 1,
            select: { id: true, kode: true, nama: true, tahun: true },
          },
        },
      },
      dosen: {
        select: {
          id: true,
          nidn: true,
          user: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type ProfileRecord = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

function studentNotFound(): never {
  throw { name: "NotFound", message: "Mahasiswa tidak ditemukan" };
}

export class StudentProfileService {
  private static async findProfile(userId: string): Promise<ProfileRecord> {
    const profile = await prisma.user.findUnique({
      where: { id: userId, role: Role.Mahasiswa },
      select: profileSelect,
    });
    if (!profile?.mahasiswa) studentNotFound();
    return profile;
  }

  private static async toResponse(profile: ProfileRecord) {
    if (!profile.mahasiswa) studentNotFound();

    const avatarUrl = profile.avatarKey
      ? await S3Service.createReadUrl(profile.avatarKey)
      : null;
    const mahasiswa = profile.mahasiswa;
    const studyProgram = {
      id: mahasiswa.prodi.id,
      code: mahasiswa.prodi.kode,
      name: mahasiswa.prodi.name,
    };
    const faculty = {
      id: mahasiswa.prodi.fakultas.id,
      code: mahasiswa.prodi.fakultas.kode,
      name: mahasiswa.prodi.fakultas.name,
    };

    return {
      header: {
        avatarUrl,
        name: profile.name,
        nim: mahasiswa.nim,
        studyProgram,
        faculty,
        status: mahasiswa.status,
      },
      personal: {
        name: profile.name,
        nik: profile.nik,
        gender: profile.gender,
        birthPlace: profile.birthPlace,
        birthDate: profile.birthDate,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
      },
      academic: {
        nim: mahasiswa.nim,
        faculty,
        studyProgram,
        cohort: mahasiswa.angkatan,
        semester: mahasiswa.semester,
        status: mahasiswa.status,
        academicAdvisor: mahasiswa.dosen
          ? { id: mahasiswa.dosen.id, nidn: mahasiswa.dosen.nidn, name: mahasiswa.dosen.user.name }
          : null,
        curriculum: mahasiswa.prodi.kurikulum[0]
          ? {
              id: mahasiswa.prodi.kurikulum[0].id,
              code: mahasiswa.prodi.kurikulum[0].kode,
              name: mahasiswa.prodi.kurikulum[0].nama,
              year: mahasiswa.prodi.kurikulum[0].tahun,
            }
          : null,
      },
      account: {
        username: profile.username,
        loginEmail: profile.email,
        role: profile.role,
      },
    };
  }

  static async getProfile(userId: string) {
    return this.toResponse(await this.findProfile(userId));
  }

  static async updateProfile(userId: string, input: StudentProfileUpdateInput) {
    const existing = await prisma.user.findUnique({
      where: { id: userId, role: Role.Mahasiswa },
      select: { mahasiswa: { select: { id: true } } },
    });
    if (!existing?.mahasiswa) studentNotFound();

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.birthPlace !== undefined && { birthPlace: input.birthPlace }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
        ...(input.gender !== undefined && { gender: input.gender }),
      },
    });

    return this.getProfile(userId);
  }
}
