import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { S3Service } from "./s3.service";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const AVATAR_ENTITIES = ["students", "lecturers"] as const;
export type AvatarEntity = (typeof AVATAR_ENTITIES)[number];

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const AWS_REGION = process.env.AWS_REGION!;

export class AvatarService {
    static getPublicUrl(key: string) {
        return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    }

    static async verifyKey(key: string) {
        const exists = await S3Service.checkObjectExists(key);
        if (!exists) {
            throw { name: "BadRequest", message: "File avatar tidak ditemukan. Silakan upload ulang." };
        }
    }

    static async createUploadUrl(entity: AvatarEntity, mime: string) {
        this.validateMimeType(mime);
        const extension = mime.split("/")[1];
        const key = `${entity}/${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime);
        return { uploadUrl, key };
    }

    static async createUploadUrlForEdit(entity: AvatarEntity, userId: string, mime: string) {
        this.validateMimeType(mime);

        const role = entity === "students" ? "Mahasiswa" : "Dosen";
        const user = await prisma.user.findFirst({ where: { id: userId, role } });
        if (!user) {
            throw { name: "NotFound", message: `${role} tidak ditemukan` };
        }

        const extension = mime.split("/")[1];
        const key = `${entity}/${userId}/avatar-${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime);
        return { uploadUrl, key };
    }

    static async deleteObject(key: string) {
        await S3Service.deleteUrl(key)
    }

    private static validateMimeType(mime: string) {
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
            throw { name: "BadRequest", message: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP." };
        }
    }
}
