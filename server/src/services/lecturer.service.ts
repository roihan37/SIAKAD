import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { S3Service } from "./s3.service";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const AWS_REGION = process.env.AWS_REGION!;

export class LecturerService {
    static getAvatarUrl(key: string) {
        return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    }

    static async verifyAvatarKey(key: string) {
        const exists = await S3Service.checkObjectExists(key);
        if (!exists) {
            throw { name: "BadRequest", message: "File avatar tidak ditemukan. Silakan upload ulang." };
        }
    }

    static async createAvatarUpload(mime: string) {
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
            throw { name: "BadRequest", message: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP." };
        }

        const extension = mime.split("/")[1];
        const key = `lecturers/${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime);

        return { uploadUrl, key };
    }

    static async createAvatarUploadForEdit(lecturerId: string, mime: string) {
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
            throw { name: "BadRequest", message: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP." };
        }

        const lecturer = await prisma.user.findFirst({
            where: { id: lecturerId, role: "Dosen" },
        });
        if (!lecturer) {
            throw { name: "NotFound", message: "Dosen tidak ditemukan" };
        }

        const extension = mime.split("/")[1];
        const key = `lecturers/${lecturerId}/avatar-${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime);

        return { uploadUrl, key };
    }

    static async confirmAvatarUpload(lecturerId: string, key: string) {
        const lecturer = await prisma.user.findFirst({
            where: { id: lecturerId, role: "Dosen" },
        });
        if (!lecturer) {
            throw { name: "NotFound", message: "Dosen tidak ditemukan" };
        }
        if (lecturer.avatarKey !== key) {
            throw { name: "BadRequest", message: "Key tidak sesuai dengan sesi upload yang aktif" };
        }

        await this.verifyAvatarKey(key);
        return prisma.user.update({
            where: { id: lecturerId },
            data: { avatarUrl: this.getAvatarUrl(key) },
        });
    }
}
