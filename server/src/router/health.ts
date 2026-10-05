import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { sendData } from "../lib/responseHelpers";

const router: Router = express.Router();

// Share outstanding work: a timed-out probe must not create a new DB query per request.
// The response deadline does not cancel the underlying Prisma operation.
export function createReadinessCheck(
  probe: () => PromiseLike<unknown>,
  timeoutMs = 1_000,
): () => Promise<boolean> {
  let pending: Promise<boolean> | undefined;
  return async () => {
    if (!pending) {
      pending = Promise.resolve().then(probe).then(() => true, () => false)
        .finally(() => { pending = undefined; });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        pending,
        new Promise<boolean>(resolve => {
          timer = setTimeout(() => resolve(false), timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
}

const checkReadiness = createReadinessCheck(() => prisma.$queryRaw`SELECT 1`);

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
  if (await checkReadiness()) {
    sendData(res, { status: "ok" });
  } else {
    sendData(res, { status: "error", reason: "Service Unavailable" }, 503);
  }
});

export default router;
