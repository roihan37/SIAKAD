import { Role } from "@prisma/client";

const test: number = "abc";

declare module "express-serve-static-core" {
  interface Request {
    userLogin: {
      id: string;
      role: Role;
    };
  }
}