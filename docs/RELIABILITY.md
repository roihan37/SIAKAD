# Reliability and Production Readiness

## Current state

M1 now separates no-emit typechecking from production compilation and emits the `dist/server.js` expected by startup. Clean compilation and isolated startup passed on Node 24.18.0; live dependency readiness remains unverified. M3 now supplies standard lint/test commands; known legacy lint findings still prevent an all-green gate. See [build instructions](../server/docs/production-build.md).

M2 now validates required application environment settings before listening. AWS credential resolution remains lazy through the SDK; successful startup is not a database/S3 readiness check. **M4 adds a shared `AppError` boundary with safe centralized error handling, requestId generation, Prisma error mapping, and comprehensive test coverage.**

`server/src/server.ts` starts Express directly on port 4000. Central error handling exists in `middleware/errHendler.ts` with enhanced security guards and backward-compatible legacy error mappings. Console logging remains for unknown errors; explicit health endpoints, a standard API catch-all 404, structured request logging, and graceful shutdown are absent from the entry point.

## Target production safeguards

These are future acceptance criteria, not descriptions of implemented features.

- Separate no-emit typechecking from production compilation. A clean build must emit the artifact used by `npm start`; verify startup without a TypeScript development loader or stale output. ✅ (M1)
- Validate required environment configuration before accepting traffic. Dependency failures must be visible and safe. ✅ (M2)
- Add `GET /health/live` for process liveness and `GET /health/ready` for readiness. Readiness should check required dependencies with bounded timeouts and return a non-ready status such as 503 when unavailable. Liveness should not fail solely because PostgreSQL is down. Do not leak connection details.
- Plan health-route placement explicitly: the current shared authentication middleware runs before most routes. Probes must work under the intended deployment access policy without weakening business-route authorization.
- Add a standard JSON API 404, after known API routes and before the error handler. Test unknown routes both with and without authentication: middleware order currently affects their responses. Any change to existing unauthenticated behavior needs an explicit compatibility decision before implementation.
- Strengthen the existing error handler and introduce typed application errors incrementally. Unexpected errors remain safe HTTP 500 responses. Preserve existing named-object mappings until their callers are migrated. ✅ (M4)
- Add structured logs with timestamp, level, request ID, method, sanitized path, status, duration, and safe error code. Redact credentials, tokens, personal data, and sensitive URL parameters. Validate untrusted request IDs; response metadata additions need compatibility review.
- Handle SIGTERM/SIGINT with a bounded drain: stop accepting new work, finish or time out in-flight requests, then close database resources. Avoid silent unhandled failures.
- Use transactions for atomic domain operations and test rollback/concurrency where relevant. Do not introduce schema changes as a side effect of reliability work.

## Release evidence

Run all backend quality gates from [QUALITY.md](QUALITY.md), verify clean artifact startup in an isolated environment, exercise health during dependency failure, and check redacted logs and graceful shutdown. Do not run migrations or seeds as smoke tests. Record results and rollback steps in the [platform plan](exec-plans/active/platform-hardening.md). Reliability and credential safety precede architectural cleanup.

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
