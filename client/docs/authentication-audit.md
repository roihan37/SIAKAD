# Frontend authentication audit — 23 September 2026

## Scope and contract

Reviewed `server/docs/authentication.md`, auth router/controller/service/middleware, password validation, error codes and CORS before changing the frontend. Existing Redux Toolkit, Axios and routing are retained. Tokens remain in Redux memory; JavaScript never reads or writes the HttpOnly refresh cookie. No production credentials or new demo defaults were added.

## Findings and changes

- Interceptor refresh previously committed only accessToken. It now commits accessToken and the complete user (id, role, mustChangePassword) atomically through `sessionReceived`.
- Refresh/network errors previously logged users out and reset several caches indiscriminately. Only definitive refresh 401 or TOKEN_INVALID ends the local session; network/5xx/429 failures remain retryable. Initial session recovery blocks routing and offers retry instead of displaying the login page prematurely.
- Refresh remains single-flight per tab; Web Locks serialize cookie operations across tabs. Login/logout use the same lock. Epoch checks before/after refresh and login prevent late results from restoring a logged-out session. Logout waits for local in-flight login/refresh even without Web Locks.
- BroadcastChannel carries only login/logout events, never tokens or credentials. Other tabs clear old identity/caches on logout or identity changes. Unsupported Web Locks browsers still have a possible cross-tab cookie-rotation race; no localStorage token or homemade insecure cookie handling was introduced.
- Only 401 TOKEN_EXPIRED triggers one retry. Login/refresh/logout use an isolated cookie client. 403 FORBIDDEN does not refresh; PASSWORD_CHANGE_REQUIRED activates the password gate. TOKEN_INVALID invalidates the local session. Retried requests use the current token, and requests/results from older epochs are rejected.
- Root reducer resets all domain caches on logout/identity/role/password-gate changes. Session middleware ignores late async results even from legacy reducers. Individual slices no longer clear caches merely because refresh encountered a transient error.
- Required password change precedes the role gate. Non-admin users see restricted access and logout, without mounting admin pages. Password confirmation, 12-character minimum, 72-byte UTF-8 maximum and different-password checks are enforced. Backend errors remain visible. Successful changes invalidate local/other-tab sessions and require login again.
- Login shows backend errors, prevents duplicate submissions and has no prefilled credentials. Auth thunk request arguments are kept out of Redux DevTools by disabling DevTools. Raw Axios/form error logging that could include auth headers/credentials was removed.
- Retry-After accepts seconds or an HTTP date. Login/password/recovery/logout retry controls show cooldowns. Refresh also enforces its cooldown in the session manager. When 429 has no readable Retry-After, the UI uses a 60-second fallback.
- If server logout fails, local identity/caches are still cleared and cookie-session logout can be retried. A network failure cannot prove server revocation; the login screen reports this explicitly.

## Backend mismatch

CORS allowed credentials but did not expose Retry-After. Cross-origin JavaScript (including localhost on different ports) therefore could not read it. After explaining this mismatch, the only backend implementation change made for this audit was adding `exposedHeaders: ["Retry-After"]` in `server/src/server.ts`. Restart/redeploy the backend for this header policy to take effect. No auth business logic, schema or database data was changed by this audit.

The backend minimum-password check uses JavaScript UTF-16 `.length`; the frontend counts Unicode code points as characters. ASCII behaves identically; frontend does not accept fewer than 12 characters merely because emoji occupy multiple UTF-16 units. Both enforce the same 72-byte UTF-8 limit.

## File map

- `src/api/axios.ts`: Axios configuration, latest authorization header, bounded retry, response/error handling and cross-tab event wiring.
- `src/api/session-manager.ts`: shared rotation, locks, epochs, login/logout coordination and refresh cooldown.
- `src/api/auth-errors.ts`, `src/types/auth.ts`: typed auth contracts, safe errors, Retry-After parsing and password validation.
- `src/features/auth-session.ts`, `src/features/action/authThunk.ts`, `src/features/slice/authSlice.ts`: typed session actions, four auth thunks, independent recovery/login/logout/password state.
- `src/app/store.ts`, `src/app/middleware/session-guard.ts`: centralized cache reset and stale-response isolation; DevTools disabled to avoid exposing auth arguments.
- `src/features/slice/{attendance,dashboard,grade,payment,studentAttendance,studentFinance,tuition}Slice.ts`: remove unconditional reset on refresh rejection.
- `src/components/protect-web/{SessionGate,PasswordChange,ProtectedRoute,PublicRoute}.tsx`: initialization recovery, forced password change and admin-only routing.
- `src/components/login-form.tsx`, `src/components/nav/nav-user.tsx`, `src/hooks/use-retry-after.ts`: safe errors, loading and cooldown controls.
- `src/types/state.ts`: reuse AuthState instead of a duplicate auth interface.
- `src/features/action/mahasiswaThunk.ts`, `src/components/form-add-data/mahasiswa-form.tsx`: remove raw error console logging that could disclose credentials/headers.
- `.env.example`: public API URL configuration only.
- `tests/auth.test.cjs`: reproducible mock transport/state/render tests.

## Verification and limits

Passed:

- `cd client && node --test tests/auth.test.cjs`: 13 tests. Covers login success/failure, bootstrap refresh, network/5xx recovery, parallel expired requests, single retry, invalid token, forbidden response, refresh denial, cookie endpoint recursion exclusion, logout vs late refresh/login, forced password change, current-password rejection, successful change, 429 cooldown, byte validation, simulated cross-tab locks/logout, sensitive-cache purge and late legacy responses, server-rendered non-admin/password gating, failed logout recovery and HTTP-date Retry-After.
- `cd client && npm run build`: TypeScript and Vite build pass. Existing Vite config/chunk-size warnings remain.
- Targeted ESLint for new/changed auth implementation passes. Full legacy project lint was not claimed.
- `cd server && npx tsc --noEmit`: passes.
- Backend `auth-security.cjs` and `route-authorization.cjs`: pass using their mock database/test infrastructure.

Browser against the active local backend, performed before the user requested no further browser testing:

- Existing cookie session restored into the dashboard; reload restored the session again.
- Logout returned to login; reload stayed logged out.
- Intentionally invalid credentials displayed the backend error and re-enabled login.
- Direct `/dashboard` without a session first showed session initialization, then redirected to login.

Not tested with real accounts/backend state: a new successful login, natural 15-minute expiry, cross-tab rotation races, network fault injection, actual 429 exhaustion, forced password change and password mutation, or non-admin live sign-in. These scenarios have mock coverage where listed above, not live end-to-end proof. No further browser testing was performed after the user's instruction.

## Environment

Set `VITE_API_URL=http://localhost:4000/api/v1/` locally; production must use the real HTTPS API URL including `/api/v1/`. The development fallback is localhost. Axios sets `withCredentials: true` for both clients. Backend CLIENT_ORIGIN must equal the frontend origin. HttpOnly/SameSite=Strict cookie behavior requires a same-site deployment; cross-site hosting needs a separate cookie/CSRF design. Web Locks require browser support/secure context (localhost supported). No token, password or refresh-cookie value belongs in VITE_* variables.
