import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../lib/bycript";
import { generateAccessToken, generateTokens } from "../lib/sendToken";

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


        } catch (error) {

        }
    }
}

