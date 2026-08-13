import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Using `datasourceUrl` is compatible with Prisma client runtime when not using
// a separate adapter package. This avoids requiring unpublished adapter libs.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export { prisma };