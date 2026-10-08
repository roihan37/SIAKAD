import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { decoded } from "../lib/jwt";
import { prisma } from "../lib/prisma";


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
  
      const match = /^Bearer ([^\s]+)$/.exec(authHeader);
      if (!match) throw { name: "TokenInvalid" };
      const payload = decoded(match[1]);
      // A revoked session invalidates access tokens immediately after logout/password reset.
      const session = await prisma.refreshToken.findUnique({
        where: { id: payload.sid },
        select: { userId: true, revoked: true, expireAt: true, user: { select: { id: true, role: true, mustChangePassword: true } } },
      });
      if (!session || session.userId !== payload.id || session.revoked || session.expireAt <= new Date()) throw { name: "TokenInvalid" };
      const user = session.user;
      if (user.mustChangePassword && req.originalUrl.split('?')[0] !== '/api/v1/auth/change-password') {
        throw { name: "PasswordChangeRequired", message: "Change your password before continuing." };
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

// Gunakan setelah authMiddleware untuk endpoint milik mahasiswa yang sedang login.
export function mahasiswaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.userLogin) {
    return next({ name: "TokenInvalid" });
  }

  if (req.userLogin.role !== Role.Mahasiswa) {
    return next({ name: "Forbidden", message: "Akses hanya untuk mahasiswa" });
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
