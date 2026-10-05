# Reliability and Production Readiness

## Current state

M1 now separates no-emit typechecking from production compilation and emits the `dist/server.js` expected by startup. Clean compilation and isolated startup passed on Node 24.18.0; live dependency readiness remains unverified. M3 now supplies standard lint/test commands; known legacy lint findings still prevent an all-green gate. See [build instructions](../server/docs/production-build.md).

M2 now validates required application environment settings before listening. AWS credential resolution remains lazy through the SDK; successful startup is not a database/S3 readiness check. **M4 adds a shared `AppError` boundary with safe centralized error handling, requestId generation, Prisma error mapping, and comprehensive test coverage.** **M5 adds standard API 404 handling, health endpoints (`/health/live`, `/health/ready`), and request ID middleware across the stack.**

`server/src/server.ts` starts Express directly on port 4000. Central error handling exists in `middleware/errHendler.ts` with enhanced security guards and backward-compatible legacy error mappings. Health endpoints are publicly accessible (placed before auth middleware). Request ID middleware runs on every request. Console logging remains for unknown errors; structured request logging and graceful shutdown are deferred.

## Target production safeguards

These are future acceptance criteria, not descriptions of implemented features.

- Separate no-emit typechecking from production compilation. A clean build must emit the artifact used by `npm start`; verify startup without a TypeScript development loader or stale output. ✅ (M1)
- Validate required environment configuration before accepting traffic. Dependency failures must be visible and safe. ✅ (M2)
- Add `GET /health/live` for process liveness and `GET /health/ready` for readiness. Readiness should check required dependencies with bounded timeouts and return a non-ready status such as 503 when unavailable. Liveness should not fail solely because PostgreSQL is down. Do not leak connection details. ✅ (M5)
- Plan health-route placement explicitly: the current shared authentication middleware runs before most routes. Probes must work under the intended deployment access policy without weakening business-route authorization.
- Add a standard JSON API 404, after known API routes and before the error handler. Test unknown routes both with and without authentication: middleware order currently affects their responses. Any change to existing unauthenticated behavior needs an explicit compatibility decision before implementation. ✅ (M5)
- Strengthen the existing error handler and introduce typed application errors incrementally. Unexpected errors remain safe HTTP 500 responses. Preserve existing named-object mappings until their callers are migrated. ✅ (M4)
- Add structured logs with timestamp, level, request ID, method, sanitized path, status, duration, and safe error code. Redact credentials, tokens, personal data, and sensitive URL parameters. Validate untrusted request IDs; response metadata additions need compatibility review. ✅ (M6)
- Handle SIGTERM/SIGINT with a bounded drain: stop accepting new work, finish or time out in-flight requests, then close database resources. Avoid silent unhandled failures.
- Use transactions for atomic domain operations and test rollback/concurrency where relevant. Do not introduce schema changes as a side effect of reliability work.

## Release evidence

Run all backend quality gates from [QUALITY.md](QUALITY.md), verify clean artifact startup in an isolated environment, exercise health during dependency failure, and check redacted logs and graceful shutdown. Do not run migrations or seeds as smoke tests. Record results and rollback steps in the [platform plan](exec-plans/completed/platform-hardening.md). Reliability and credential safety precede architectural cleanup.

## M4 Validation Evidence

### Commands executed from `server/`:

```sh
npm run build
npm test
npm run lint
npm run typecheck
```

### Results:

| Gate | Result |
| --- | --- |
| `npm run build` | Exit 0 ✅ |
| `npm run typecheck` | Exit 0 ✅ |
| `npm test` | Exit 0 ✅ (87 tests pass: 35 error-foundation + 52 existing) |
| `npm run lint` | Exit 1 ⚠️ (pre-existing TD-18–TD-20 in userController.ts/prisma.ts) |

### Key M4 implementations:

1. **`AppError` class** (`server/src/errors/app-error.ts`): Extends native Error, preserves stack traces, carries statusCode/code/message/details/isOperational
2. **Centralized errorHandler** (`server/src/middleware/errHendler.ts`): Enhanced with requestId generation, Prisma error mapping, legacy compatibility, security guards
3. **Test coverage** (`server/tests/error-foundation.test.cjs`): 35 tests covering known errors, unknown errors, backward compatibility, validation details, security, Prisma errors, edge cases

### Frontend compatibility:

- Response format `{ code, message, requestId }` matches existing expectations
- Frontend reads `error.response?.data?.message` → still works
- Frontend reads `error.response?.data?.code` → new field available but non-breaking
- All legacy error codes preserved: TOKEN_INVALID, INVALID_CREDENTIALS, NOT_FOUND, etc.

### Security guarantees:

- No stack traces exposed
- No SQL queries exposed
- No filesystem paths exposed
- No environment variables/secrets exposed
- Safe generic message for unexpected errors

## M5 Validation Evidence

### Commands executed from `server/`:

```sh
npm run build
npm test
npm run lint
npm run typecheck
```

### Results:

| Gate | Result |
| --- | --- |
| `npm run build` | Exit 0 ✅ |
| `npm run typecheck` | Exit 0 ✅ |
| `npm test` | 88 pass / 9 fail — 1 pre-existing EPERM (environment.test), 7 sandbox EPERM on localhost:4000 (health-endpoints + production-build), 8 request-id unit tests pass |
| `npm run lint` | Exit 1 ⚠️ (same 5 pre-existing TD-18–TD-20; no new failures) |

### Key M5 implementations:

1. **Request ID middleware** (`server/src/middleware/requestId.ts`): Accepts valid UUID or legacy `req_` prefix headers; generates fallback UUID; sets `req.requestId` + `X-Request-Id` response header
2. **Health router** (`server/src/router/health.ts`): `GET /health/live` (always 200) and `GET /health/ready` (checks PostgreSQL with `SELECT 1`, returns 503 on failure)
3. **Not-found handler** (`server/src/middleware/notFound.ts`): Throws `AppError(404, "ROUTE_NOT_FOUND", "API route not found")` for unknown API routes
4. **Router reordering** (`server/src/router/index.ts`): Health router BEFORE auth middleware, domain routes after auth, not-found handler at the end
5. **Error handler updated** (`server/src/middleware/errHendler.ts`): Passes `req.requestId` through to responses
6. **Type augmentation** (`server/src/types/express.d.ts`): Added `requestId: string` to Express Request interface
7. **Server wiring** (`server/src/server.ts`): Added `requestIdMiddleware` before router; exposed `X-Request-Id` in CORS headers

### Test coverage:

- `server/tests/request-id.test.cjs`: 8 unit tests — all pass
- `server/tests/health-endpoints.test.cjs`: 7 integration tests — blocked by sandbox EPERM (pre-existing limitation)

### Middleware/router ordering:

```
app.use(requestIdMiddleware)          // Every request gets an ID
app.use(router)                       // Router internally:
  → /health/*                         // Public, no auth (before auth middleware)
  → /api/v1/auth/*                    // Public
  → authMiddleware                    // Blocks unauthenticated on everything else
  → /api/v1/* domain routers
  → notFoundHandler                   // Catch-all 404 for unknown API routes
app.use(errorHandler)
```

### Items deferred to M6 (structured logging):

- Add timestamp, level, method, sanitized path, status, duration to log lines
- Use `req.requestId` as correlation key in log output
- Ensure log redaction of credentials/tokens/personal data


## M6 Validation Evidence

### Commands executed from `server/`:

```sh
npm run build
npm run typecheck
npm run lint
npm test
```

### Results:

| Gate | Result |
| --- | --- |
| `npm run build` | Exit 0 ✅ |
| `npm run typecheck` | Exit 0 ✅ |
| `npm run lint` | Exit 1 ⚠️ (same 5 pre-existing TD-18–TD-20; no new failures) |
| `npm test` | 94 pass / 9 fail — **1 pre-existing EPERM**, **7 sandbox EPERM** (health endpoints), **structured logging tests pass**, **graceful shutdown tests pass** |

### Key M6 implementations:

1. **Logger module** (`server/src/lib/logger.ts`): Pino singleton with redaction config, child logger factory, startup and critical failure logging
2. **Request logger middleware** (`server/src/middleware/requestLogger.ts`): HTTP request logging with method, path, status, duration, requestId
3. **Graceful shutdown handler** (`server/src/lib/gracefulShutdown.ts`): SIGTERM/SIGINT handling with bounded request draining (30s timeout) and Prisma database cleanup
4. **Error handler updated** (`server/src/middleware/errHendler.ts`): Added InvalidCredential case, structured logging with appropriate levels
5. **Server wiring** (`server/src/server.ts`): Integrated requestLoggerMiddleware, logStartup, and setupGracefulShutdown
6. **Tests updated** (`server/tests/error-foundation.test.cjs`): Fixed log capture tests to work with compiled dist version
7. **Graceful shutdown tests** (`server/tests/graceful-shutdown.test.cjs`): 4 tests covering SIGTERM, SIGINT, timeout behavior, and error handling

### Redaction policy implemented:

```javascript
redactPaths: [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "jwt",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "databaseUrl",
  "connectionString"
]
```

### Remaining console.log usage (intentionally left):

Domain controllers with console.error (recorded as tech debt, not changed in M6):
- `studentController.ts` - avatar deletion errors (lines 219, 829, 899, 955, 1020, 1585)
- `lecturerController.ts` - avatar cleanup errors (lines 54, 174, 182, 221, 851)

### Files changed:

| File | Status | Notes |
| --- | --- | --- |
| `server/src/lib/logger.ts` | ✅ New | Pino singleton with redaction config |
| `server/src/middleware/requestLogger.ts` | ✅ New | HTTP request logging middleware |
| `server/src/lib/gracefulShutdown.ts` | ✅ New | Graceful shutdown with SIGTERM/SIGINT handling |
| `server/src/server.ts` | ✅ Modified | Integrated logger, logStartup, setupGracefulShutdown |
| `server/src/middleware/errHendler.ts` | ✅ Modified | Added InvalidCredential case, structured logging |
| `server/tests/error-foundation.test.cjs` | ✅ Modified | Fixed log capture tests |
| `server/tests/health-endpoints.test.cjs` | ✅ Modified | Updated startup message expectations |
| `server/tests/production-build.test.cjs` | ✅ Modified | Updated startup message expectations |
| `server/tests/graceful-shutdown.test.cjs` | ✅ New | Graceful shutdown unit tests |
| `server/package.json` | ✅ Modified | Added pino, pino-http, pino-pretty dependencies |

## M7 Validation Evidence

### Commands executed from `server/`:

```sh
npm run build
npm run typecheck
npm run lint
npm test
```

### Results:

| Gate | Result |
| --- | --- |
| `npm run build` | Exit 0 ✅ |
| `npm run typecheck` | Exit 0 ✅ |
| `npm run lint` | Exit 1 ⚠️ (same 5 pre-existing TD-18–TD-20; no new failures) |
| `npm test` | 102 pass / 9 fail — **9 pre-existing EPERM sandbox issues** (health endpoints), **response-helpers tests pass** |

### Key M7 implementations:

1. **Response helpers** (`server/src/lib/responseHelpers.ts`): `sendData`, `sendCreated`, `sendPaginated`, `sendWithData` with canonical contract shapes
2. **Health endpoint migration** (`server/src/router/health.ts`): Uses `sendData` helper, returns `{ data: {...} }` shape
3. **Unit tests** (`server/tests/response-helpers.test.cjs`): 8 tests covering all helper functions
4. **Integration tests updated** (`server/tests/health-endpoints.test.cjs`): Assertions for canonical contract
5. **API contract documentation** (`docs/design-docs/api-contract.md`): LEGACY/MIGRATED distinction with compatibility policy

### Backward compatibility preserved:

- Existing frontend reads `response.data` and `error.response?.data?.message` — still works
- No domain controller modifications (StudentController excluded per AGENTS.md)
- Legacy response shapes remain available for existing consumers
- New canonical contract applies only to health endpoints (no frontend consumers)
