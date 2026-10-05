import { clientOrigin, jwtSecret } from "./auth/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import router from "./router/index";
import { errorHandler } from "./middleware/errHendler";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { logStartup } from "./lib/logger";
import { setupGracefulShutdown } from "./lib/gracefulShutdown";

jwtSecret(); // Auth configuration validates all application settings before listening.
const app = express();
const port = 4000;

// Request ID middleware — runs on every request, generates/validates request ID
app.use(requestIdMiddleware);

// Request logging middleware — logs method, path, status, duration, requestId
app.use(requestLoggerMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    // Allow the frontend to honor authentication rate-limit cooldowns across origins.
    exposedHeaders: ["Retry-After", "X-Request-Id"],
  })
);

app.use(router);

app.use(errorHandler);

const server = app.listen(port, () => {
  logStartup(port);
});

// Graceful shutdown handler with bounded request draining
setupGracefulShutdown({
  timeoutMs: 30_000,
  onShutdown: async () => {
    // Stop accepting new requests
    server.close(() => {});
  },
});
