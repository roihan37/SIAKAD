# Security

## Current architecture and gaps

The backend validates signing configuration at startup through `server/src/auth/config.ts`. Authentication includes JWT access tokens, refresh-session services, HTTP-only refresh cookies, production secure-cookie settings, and origin/rate-limit middleware. These are observed controls, not a complete security audit.

`server/src/config/s3.ts` explicitly supplies `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` using non-null assertions. This needs configuration hardening; it is not evidence that literal credentials were committed. Environment file values were not needed for the harness inspection.

## Target safeguards for future changes

- Never commit or print secrets, passwords, database credentials, authorization headers, session cookies, refresh tokens, or private keys. Use deployment configuration or a secret manager; examples contain placeholders only.
- Prefer temporary workload-role credentials in AWS production deployments and least-privilege S3 permissions. Validate required configuration without logging values. Audit deployment assumptions before changing providers.
- Preserve signing-secret validation, token rotation/revocation, cookie scope, origin checks, and session isolation. Use the existing bcrypt-based password hashing; never store plaintext passwords.
- Enforce role and resource ownership on the server. Authentication alone is insufficient: a student must not gain access to another student's KRS, grades, or financial data. Frontend route guards are not a security boundary.
- Validate upload size, content/type, object key, and ownership. Do not trust client-provided metadata. Treat presigned URLs as sensitive.
- Send safe public errors. Do not expose stacks, database details, filesystem paths, or secrets. Redact logs and minimize student personal and financial information.
- Review security dependency changes and use isolated test credentials/data. Never weaken a control just to make a test pass.

The [platform plan](exec-plans/active/platform-hardening.md) must verify missing/invalid configuration, role credentials, authorization regressions, and log redaction before release. This document schedules no credential rotation, code modification, or infrastructure operation during bootstrap.
