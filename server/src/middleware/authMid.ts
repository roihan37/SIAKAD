import { Request, Response, NextFunction } from "express";
import { decoded } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { ResultToken } from "../types/token";


export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw { name: "Unauth" };
      }
  
      const token = authHeader.split(" ")[1];
  
      const payload = decoded(token) as ResultToken;
      console.log(payload, '<<');
      
      const user = await prisma.user.findUnique({
        where: {
          id: payload.id,
        },
      });
  
      if (!user) {
        throw { name: "NotFound" };
      }
  
      req.userLogin = {
        id: user.id,
        role: user.role,
      };
  
      next();
    } catch (error) {
      
      // res.send(error)
      
      next(error);
    }
  }