import { Prisma } from "@prisma/client";
import { hashPassword } from "../lib/bycript";

export interface ResetPasswordResult {
    id: string;
    name: string;
    nim: string;
    mustChangePassword: true;
}

export class StudentAccountService {
    /**
     * Reset a student's password and revoke existing sessions.
     * Used by PATCH /api/v1/students/:userId/reset-password
     * 
     * Note: This method expects a TransactionClient because the caller
     * (controller) wraps the entire operation in a transaction.
     */
    static async resetPassword(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        newPassword: string
    ): Promise<ResetPasswordResult> {
        // Validate password length
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
            throw {
                name: "BadRequest",
                message: "Password minimal 8 karakter",
            };
        }

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                role: true,
                mahasiswa: {
                    select: {
                        id: true,
                        nim: true,
                    },
                },
            },
        });

        if (!user || !user.mahasiswa) {
            throw {
                name: "NotFound",
                message: "Mahasiswa tidak ditemukan",
            };
        }

        const hashedPassword = await hashPassword(newPassword);

        // Password reset and session revocation are performed within
        // the transaction opened by the controller.
        await prismaClient.user.update({ 
            where: { id: userId }, 
            data: { password: hashedPassword, mustChangePassword: true } 
        });
        
        await prismaClient.refreshToken.updateMany({ 
            where: { userId }, 
            data: { revoked: true } 
        });

        return {
            id: user.id,
            name: user.name,
            nim: user.mahasiswa.nim,
            mustChangePassword: true,
        };
    }
}
