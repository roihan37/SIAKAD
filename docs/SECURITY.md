# Security

## Current architecture and gaps

The backend validates critical application configuration at startup through `server/src/config/env.ts`, consumed by auth, Prisma, and storage configuration. Authentication includes JWT access tokens, refresh-session services, HTTP-only refresh cookies, production secure-cookie settings, and origin/rate-limit middleware. These are observed controls, not a complete security audit.

M2 removes explicit static credentials from `server/src/config/s3.ts`; the SDK resolves standard environment/profile or workload-role credentials. Configuration diagnostics expose variable names and rules only, not values. `server/.env.example` contains placeholders and real server `.env.*` files are ignored. Runtime values take precedence over local dotenv values.

A targeted current-tree scan found demo passwords in seed configuration/docs and frontend login shortcuts, test-only secrets, and an auth timing placeholder; no apparent production keys or private-key blocks were found in tracked files. No real environment files are tracked. This is not a history or exhaustive secret audit. The local server environment file was inspected for key names only. Existing raw error logging in controllers/error middleware remains a potential disclosure risk; this milestone verifies safe configuration diagnostics, not global log redaction. Seed startup no longer prints its default password; demo defaults and frontend shortcuts remain unchanged.

## Target safeguards for future changes

- Never commit or print secrets, passwords, database credentials, authorization headers, session cookies, refresh tokens, or private keys. Use deployment configuration or a secret manager; examples contain placeholders only.
- Prefer temporary workload-role credentials in AWS production deployments and least-privilege S3 permissions. Validate required configuration without logging values. Audit deployment assumptions before changing providers.
- Preserve signing-secret validation, token rotation/revocation, cookie scope, origin checks, and session isolation. Use the existing bcrypt-based password hashing; never store plaintext passwords.
- Enforce role and resource ownership on the server. Authentication alone is insufficient: a student must not gain access to another student's KRS, grades, or financial data. Frontend route guards are not a security boundary.
- Validate upload size, content/type, object key, and ownership. Do not trust client-provided metadata. Treat presigned URLs as sensitive.
- Send safe public errors. Do not expose stacks, database details, filesystem paths, or secrets. Redact logs and minimize student personal and financial information.
- Review security dependency changes and use isolated test credentials/data. Never weaken a control just to make a test pass.

The [platform plan](exec-plans/active/platform-hardening.md) must verify missing/invalid configuration, role credentials, authorization regressions, and log redaction before release. This document schedules no credential rotation, code modification, or infrastructure operation during bootstrap.


## Logging Security

Structured logging with Pino (M6) includes automatic redaction of sensitive fields:
- Authorization headers, session cookies
- JWT tokens, passwords, refresh tokens
- Database URLs and connection strings

Redaction configuration is centralized in .
The censor value  replaces all matched fields.

Never log:
- Full error objects without sanitization
- Request/response bodies (can contain PII)
- Stack traces in production (prevented by errorHandler design)


## API Response Security

M7 establishes a canonical API response contract that supports security requirements:

- Error responses include `requestId` for traceability without exposing internals
- Health endpoints are public but return minimal information
- Response helpers prevent accidental exposure of sensitive fields
- No stack traces, SQL queries, or secrets in client-facing responses
