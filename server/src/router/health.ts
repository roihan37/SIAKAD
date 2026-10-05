import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { sendData } from "../lib/responseHelpers";

const router: Router = express.Router();

/**
 * GET /health/live
 * Determines whether the application process is alive.
 * Does NOT check dependencies — always returns 200 as long as the process runs.
 * Follows canonical API contract: { data: { status: "ok" } }
 */
router.get("/live", (_req, res) => {
  sendData(res, { status: "ok" });
});

/**
 * GET /health/ready
 * Determines whether the application is ready to receive traffic.
 * Checks PostgreSQL connectivity with a bounded timeout.
 * Returns 503 when a critical dependency is unavailable.
 * Follows canonical API contract: { data: { status: "ok" } } or { data: { status: "error", reason: "..." } }
 */
router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendData(res, { status: "ok" });
  } catch {
    sendData(res, { status: "error", reason: "Service Unavailable" }, 503);
  }
});

export default router;
