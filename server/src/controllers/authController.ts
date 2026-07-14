import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../lib/bycript";
import { generateAccessToken, generateTokens } from "../lib/sendToken";
import { addRefreshtokenToWishlist } from "../auth/auth.service";

export class Controller {
    static async login(req: Request, res: Response) {
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
            await addRefreshtokenToWishlist({refreshToken, userId : user.id})

            res
                .cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 1000 * 60 * 60 * 24 // 1 hari
                })
                .status(200).json({accessToken})

        } catch (error) {
            console.log(error);
            
            // if (typeof error === 'object' && error !== null && 'name' in error) {
            //     const err = error as { name: string };

            //     if (err.name === "badRequest") {
            //         res.status(400).json({ message: "Email / Password is required" });
            //     } else if (err.name === "Unauthorized") {
            //         res.status(401).json({ message: "Invalid Email / Password" });
            //     } else {
            //         res.status(500).json({ message: "Internal Server Error" });
            //     }
            // } else {
            //     res.status(500).json({ message: "Unknown Error" });
            // }
        }
    }
}

