# Authentication security

## Configuration and deployment

Set JWT_SECRET to a cryptographically random secret of at least 32 bytes, stored outside version control. The server fails at startup if it is missing/too short; there is no fallback secret. Local ignored .env was given a generated secret only if JWT_SECRET was absent. Configure production separately and rotate the previously hardcoded signing key. Existing access tokens using the old signature/payload are rejected.

CLIENT_ORIGIN defaults to http://localhost:5173. Set it to the exact frontend origin in production; VITE_API_URL configures the frontend API URL. Use HTTPS. Cookies are HttpOnly, SameSite=Strict, Secure in production, and scoped to /api/v1/auth. This configuration requires a same-site deployment; cross-site frontend/backend hosting needs an explicit cookie/CSRF design.

## Sessions

Access JWTs contain only id, role and sid, plus standard timing/issuer/audience claims, expire in 15 minutes, and require HS256 with the expected issuer/audience. Authorization reads the current role from the database, not the JWT role. Every authenticated request validates the session against RefreshToken so revocation invalidates access immediately.

Refresh tokens contain 32 random bytes and are stored as SHA-512 hashes. A session lasts one day with an absolute expiry. Rotation atomically replaces the hash using a conditional update, retaining the session ID and expiry. One refresh token has one successful consumer; replay/expired tokens receive 401 without revoking unrelated sessions. No token-family theft detection is claimed: the current schema retains only the latest hash. A losing refresh response does not clear a cookie that a winning concurrent response just set.

The frontend shares one refresh promise per tab and uses Web Locks to serialize across tabs where supported. Unsupported browsers may still experience a refresh conflict across tabs; the server rejects reused tokens safely. Access tokens remain in Redux memory. Refresh tokens never enter JavaScript. Logout waits for an in-flight refresh, revokes the cookie session without requiring a valid access token, and clears both current and legacy cookie paths.

## Passwords and roles

Password hashing uses a fresh bcrypt salt per call; authentication comparisons and self-service hashing are asynchronous. The synchronous hash helper remains for compatibility with existing seed/controller callers. Password changes through existing user/student/lecturer edits revoke related sessions. Admin student reset revokes all sessions and sets mustChangePassword. The middleware then allows only authenticated POST /api/v1/auth/change-password; logout and refresh remain available separately.

Password change requires currentPassword and newPassword (12+ characters, no more than 72 UTF-8 bytes), verifies the current hash, updates conditionally, clears mustChangePassword, and revokes sessions in one serializable transaction. The frontend provides the forced-change form and requires sign-in afterward. Existing demo passwords can still log in; they do not satisfy the new-password policy.

The current frontend is an administration portal and gates its pages by Admin role. Non-admin users see an access message and logout; server ownership-protected API endpoints remain available according to their middleware. JWT contents and refresh responses are not logged. Demo credentials are no longer prefilled in the login form.

## Request protection

Browser auth mutations reject untrusted Origin/cross-site requests. Missing Origin is supported for non-browser clients. Login: 20 attempts/IP/15 minutes; refresh/logout: 120; password change: 10. These limits are in-process, not distributed. Configure a shared gateway limiter for multiple instances. Do not enable unrestricted trust proxy; configure trusted proxies explicitly before relying on forwarded IPs. Authentication responses use Cache-Control: no-store. Invalid JWTs return 401, required password changes 403, throttling 429 with Retry-After.

## Verification

- Backend: npx tsc --noEmit
- Frontend: tsc -p tsconfig.app.json --noEmit
- node -r ts-node/register/transpile-only tests/auth-security.cjs
- node -r ts-node/register/transpile-only tests/route-authorization.cjs

Tests exercise JWT verification, payload minimization, distinct salts, refresh compare-and-swap/replay, session isolation/revocation, forced password change, middleware, and rate limits using a mock database. Live PostgreSQL race testing, browser end-to-end cookie testing, and a penetration test have not been performed. No schema migration is required.
