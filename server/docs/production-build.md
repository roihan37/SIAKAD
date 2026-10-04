# Backend production build

## Runtime and installation

Use the latest patched Node 24.x release (`nvm use` in `server/`); the package engine range and `.nvmrc` declare this supported major. Validation used Node 24.18.0 and npm 11.16.0. The installed Prisma 7.9.1 packages support Node `^20.19 || ^22.12 || >=24.0`; this application deliberately targets the tested Node 24 line, consistent with its Node 24 type definitions. Node 24 is an [LTS release](https://nodejs.org/en/about/previous-releases). No dependency versions were changed.

From `server/`, install build-time dependencies and generate the Prisma client:

```sh
npm ci
npm run prisma:generate
```

Supply `DATABASE_URL` before generation because `prisma.config.ts` requires it. Generation reads the existing schema and writes the client; it does not run migrations or seeds and does not require a live database. Build steps require development dependencies (TypeScript and the Prisma CLI), so do not omit them in the build stage. Configure your package manager's lifecycle-script policy for the locked packages where required; explicit generation remains necessary for the split schema directory.

## Separate commands

```sh
npm run typecheck
npm run build
npm start
```

- `typecheck`: checks `src/` with the existing strict, no-emit `tsconfig.json`.
- `build`: uses `tsconfig.build.json`, retaining existing CommonJS/ES2016 settings while overriding `noEmit`, setting `rootDir: src` and `outDir: dist`, and enabling `noEmitOnError`.
- `start`: executes `node dist/server.js`; no development loader or implicit compilation.

Build from a clean checkout/output directory for each release. `tsc` does not remove stale files from previous builds; do not deploy old output or run start after a failed build. The output is ignored by Git. Ship `dist/`, the package/lock manifests, runtime dependencies, and the generated Prisma client for the runtime environment. A bare copy of `dist/` is not a standalone bundle. Development startup remains unchanged.

## Environment prerequisites

Run commands from `server/`. Existing dotenv loading reads `.env` from the working directory when present; deployment-injected environment variables can be used instead. Never package a developer's `.env` with release artifacts.

| Variable | Existing use |
| --- | --- |
| `NODE_ENV` | Set to `production` for production behavior, including secure refresh cookies; `npm start` does not set it automatically. |
| `JWT_SECRET` | Required at startup, at least 32 bytes; provision a strong secret through deployment configuration. |
| `DATABASE_URL` | Required by Prisma CLI configuration and for runtime database operations. |
| `CLIENT_ORIGIN` | Set the real frontend origin; otherwise existing code defaults to localhost:5173. |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` | Required for existing S3 operations; current credential handling is unchanged. |

The server currently binds port 4000; a `PORT` variable is not implemented. Database connectivity and S3 permissions are not verified just by starting the listener. Environment/AWS hardening remains milestone M2; this change does not add new runtime validation.

## Focused smoke validation

After building, with port 4000 free:

```sh
node --test tests/production-build.test.cjs
```

This test launches compiled JavaScript in an empty temporary working directory with explicit dummy environment values. It verifies missing-secret failure and the existing unauthenticated HTTP 401 contract, then stops its process. It does not load the developer's `.env`, connect to PostgreSQL, or make S3 requests. It needs permission to bind a local listener. It is scoped build validation, not a replacement for the full test suite.

`npm run lint` and `npm test` currently fail because those scripts do not exist. Their implementation remains milestone M3; no placeholder commands were added. See the [execution plan](../../docs/exec-plans/active/platform-hardening.md) for actual validation evidence and limitations.
