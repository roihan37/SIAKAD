import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../../src/lib/prisma";
import { S3Service } from "../../src/services/s3.service";

export async function ensureProfilePhoto(userId: string, entity: "students" | "lecturers") {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            avatarKey: true,
        },
    });

    if (!user) {
        return;
    }

    // ==========================================
    // 1. Hapus avatar lama
    // ==========================================
    if (user.avatarKey) {
        try {
            await S3Service.deleteUrl(
                user.avatarKey
            );
        } catch (error) {
            console.warn(
                `Gagal menghapus avatar lama user ${userId}:`,
                error
            );
        }
    }

    // ==========================================
    // 2. File foto
    // ==========================================
    const photoPath = path.resolve(
        __dirname,
        "../../data/man-7796384_1280.jpg"
    );

    const fileBuffer = await readFile(
        photoPath
    );

    // ==========================================
    // 3. Generate key
    // ==========================================
    const key =
        `${entity}/${userId}/avatar-${Date.now()}.jpg`;

    // ==========================================
    // 4. Generate presigned upload URL
    // ==========================================
    const uploadUrl =
        await S3Service.createUploadUrl(
            key,
            "image/jpeg"
        );

    // ==========================================
    // 5. Upload ke S3
    // ==========================================
    const uploadResponse = await fetch(
        uploadUrl,
        {
            method: "PUT",
            headers: {
                "Content-Type": "image/jpeg",
            },
            body: fileBuffer,
        }
    );

    // WAJIB cek upload
    if (!uploadResponse.ok) {
        throw new Error(
            `Gagal upload foto ke S3: ${uploadResponse.status} ${uploadResponse.statusText}`
        );
    }

    // ==========================================
    // 6. Simpan KEY saja
    // ==========================================
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            avatarKey: key,
            avatarUrl: null,
        },
    });

    console.log(
        `✅ Foto ${entity} berhasil diupload: ${userId}`
    );
}

