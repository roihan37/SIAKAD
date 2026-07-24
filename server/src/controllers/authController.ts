import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../lib/bycript";
import { generateTokens } from "../lib/sendToken";
import { addRefreshtokenToWishlist, deleteRefreshTokenById, findRefreshToken, revokeTokensOnReuse } from "../auth/auth.service";

export class Controller {
    static async login(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { identifier, password } = req.body;


            if (!identifier || !password) {
                throw { name: "BadRequest" };
            }

            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: identifier },
                        { email: identifier }
                    ]
                }
            });

            if (!user) {
                throw { name: "Unauthorized" };
            }

            const compare = await comparePassword(password, user.password)
            if (!compare) {
                throw { name: "Unauthorized" };
            }

            const { accessToken, refreshToken } = generateTokens(user)
            await addRefreshtokenToWishlist({ refreshToken, userId: user.id })

            res
                .cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 1000 * 60 * 60 * 24 // 1 hari
                })
                .status(200).json({ accessToken })

        } catch (error) {
            next(error)
        }
    }

    static async refreshToken(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const refreshToken = req.cookies.refreshToken
            if (!refreshToken) {
                res.clearCookie('refreshToken')
                throw { name: "Unauthorized", message: "Missing refresh token." };
            }

            const refreshTokenId = await findRefreshToken(refreshToken)

            // refresh token sudah revoked
            // refresh token sudah expired
            // (idealnya) terdeteksi reuse

            if (
                !refreshTokenId ||
                refreshTokenId.revoked === true ||
                Date.now() >= refreshTokenId.expireAt.getTime()
            ) {
                if (refreshTokenId?.userId) {
                    await revokeTokensOnReuse(refreshTokenId?.userId)
                }
                res.clearCookie('refreshToken')
                throw { name: "Unauthorized", message: "Invalid or expired refresh token." };
            }


            const user = await prisma.user.findUnique({ where: { id: refreshTokenId.userId } })

            if (!user) {
                throw { name: "Unauthorized", message: "User not found." };
            }

            await deleteRefreshTokenById(user.id)
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user)
            await addRefreshtokenToWishlist({ refreshToken: newRefreshToken, userId: user.id });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 // 1 hari
            })
            .status(200)
            .json({ accessToken });

        } catch (error) {
            next(error)
        }
    }
}

