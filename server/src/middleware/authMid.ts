import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
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
        throw { name: "TokenInvalid" };
      }
  
      const token = authHeader.split(" ")[1];
  
      const payload = decoded(token) as ResultToken;
      
      
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
      
      next(error);
    }
  }

// Gunakan setelah authMiddleware untuk membatasi akses hanya bagi admin.
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.userLogin) {
    return next({ name: "TokenInvalid" });
  }

  if (req.userLogin.role !== Role.Admin) {
    return next({ name: "Forbidden", message: "Akses hanya untuk admin" });
  }

  next();
}

// Gunakan setelah authMiddleware pada route dengan :id berupa User.id.
// Admin dapat mengakses semua data; mahasiswa hanya data miliknya sendiri.
export function adminOrMahasiswaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.userLogin) {
    return next({ name: "TokenInvalid" });
  }

  const { id, role } = req.userLogin;
  if (role === Role.Admin) {
    return next();
  }

  if (role !== Role.Mahasiswa || typeof req.params.id !== "string" || req.params.id !== id) {
    return next({
      name: "Forbidden",
      message: "Akses hanya untuk admin atau mahasiswa pemilik data",
    });
  }

  next();
}
