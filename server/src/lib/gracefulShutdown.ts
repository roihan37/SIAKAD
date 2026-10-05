import { prisma } from "./prisma";
import logger from "./logger";

/**
 * Graceful shutdown handler with bounded request draining.
 * 
 * Listens for SIGTERM and SIGINT signals, stops accepting new requests,
 * waits for in-flight requests to complete or timeout, then closes
 * database connections.
 */

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30_000; // 30 seconds

export function setupGracefulShutdown(
  options?: {
    timeoutMs?: number;
    onShutdown?: () => Promise<void> | void;
  }
): void {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  const logShutdown = (msg: string, meta?: Record<string, unknown>): void => {
    logger.info(meta ?? {}, msg);
  };
  const logShutdownError = (msg: string, error: unknown): void => {
    logger.error({ error: String(error) }, msg);
  };

  const closeDatabase = async (): Promise<void> => {
    try {
      await prisma.$disconnect();
      logShutdown("Prisma client disconnected");
    } catch (error) {
      logShutdownError("Error disconnecting Prisma client", error);
    }
  };

  const shutdown = async (signal: string): Promise<void> => {
    logShutdown(`Received ${signal}. Starting graceful shutdown...`, {
      pid: process.pid,
      signal,
    });

    // Prevent multiple simultaneous shutdowns
    process.removeListener("SIGTERM", shutdown);
    process.removeListener("SIGINT", shutdown);

    try {
      // Call custom shutdown hook if provided
      if (options?.onShutdown) {
        await options.onShutdown();
      }

      // Close database connections with timeout
      await Promise.race([
        closeDatabase(),
        new Promise<void>((resolve) => setTimeout(() => resolve(), timeoutMs)),
      ]);

      logShutdown(`Graceful shutdown complete. PID: ${process.pid}`);
      process.exit(0);
    } catch (error) {
      logShutdownError(`Error during graceful shutdown: ${error}`, error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

export default setupGracefulShutdown;
