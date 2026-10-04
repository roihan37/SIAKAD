import express, { Router } from "express";
import { prisma } from "../lib/prisma";

const router: Router = express.Router();

/**
 * GET /health/live
 * Determines whether the application process is alive.
 * Does NOT check dependencies — always returns 200 as long as the process runs.
 */
router.get("/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * GET /health/ready
 * Determines whether the application is ready to receive traffic.
 * Checks PostgreSQL connectivity with a bounded timeout.
 * Returns 503 when a critical dependency is unavailable.
 */
router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", reason: "Service Unavailable" });
  }
});

export default router;
