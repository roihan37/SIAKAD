import { randomUUID } from "crypto";
import { S3Service } from "./s3.service";
import { prisma } from "../lib/prisma";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = process.env.AWS_S3_BUCKET!;
const AWS_REGION = process.env.AWS_REGION!;

export class StudentService{
    static async createAvatarUpload(
        // studentId : string,
        mime : string
    ){
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
            throw { name: "BadRequest", message: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP." };
        }

        // const user = await prisma.user.findUnique({ where: { id: studentId } });
        // if (!user) {
        //     throw { name: "NotFound", message: "User tidak ditemukan" };
        // }

        const extension = mime.split("/")[1];
        const key = `avatars/${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime)

        // await prisma.user.update({
        //     where: { id : studentId },
        //     data: { avatarKey: key }
        // })

        return {
            uploadUrl,
            key
        }
    }

    static async createAvatarUploadForEdit(
        studentId : string,
        mime : string
    ){
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
            throw { name: "BadRequest", message: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau WEBP." };
        }

        const user = await prisma.user.findUnique({ where: { id: studentId } });
        if (!user) {
            throw { name: "NotFound", message: "User tidak ditemukan" };
        }

        const extension = mime.split("/")[1];
        const key = `students/${studentId}/avatar-${randomUUID()}.${extension}`;
        const uploadUrl = await S3Service.createUploadUrl(key, mime)

        return {
            uploadUrl,
            key
        }
    }

    static async confirmAvatarUpload(studentId: string, key: string) {
        const user = await prisma.user.findUnique({ where: { id: studentId } });
        if (!user) {
            throw { name: "NotFound", message: "User tidak ditemukan" };
        }

        // cegah orang lain "mengklaim" key milik user lain lewat endpoint ini
        if (user.avatarKey !== key) {
            throw { name: "BadRequest", message: "Key tidak sesuai dengan sesi upload yang aktif" };
        }

        // verifikasi file BENAR-BENAR ada di S3 — jangan percaya klaim FE begitu saja
        const exists = await S3Service.checkObjectExists(key);
        if (!exists) {
            throw { name: "BadRequest", message: "File belum ditemukan di storage. Pastikan upload sudah selesai." };
        }

        const avatarUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        return prisma.user.update({
            where: { id: studentId },
            data: { avatarUrl },
        });
    }
}