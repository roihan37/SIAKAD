import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../lib/bycript";
import { generateTokens } from "../lib/sendToken";
import { addRefreshtokenToWishlist } from "../auth/auth.service";

export class Controller {
    static async login(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { identifier, password } = req.body;
            console.log(identifier, password);

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
}

