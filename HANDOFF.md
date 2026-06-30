# MACT CMS — Project Handoff

Enterprise case-management system for advocates handling **Motor Accident Claims
Tribunal (MACT)** litigation in India. Full-stack, deployed, and live.

> **TL;DR** — Live at **https://ajay.aryantechlabs.com**, source at
> **github.com/Rajtaya/mact-cms**, hosted on Railway (Postgres + api + web).
> Log in as `admin@mact.local`. All 9 build phases complete; security-hardened.

---

## 1. Live environment

| | |
| --- | --- |
| **App (web)** | https://ajay.aryantechlabs.com · also https://web-production-c95d9.up.railway.app |
| **API** | https://api-production-6838.up.railway.app/api |
| **Repo** | https://github.com/Rajtaya/mact-cms (public, branch `master`) |
| **Host** | Railway project `mact-cms` (id `e028f3e2-4fa6-4b74-9fa3-02ee8d205078`) |
| **DNS** | Cloudflare — `ajay` CNAME → `ou9oatrr.up.railway.app` (DNS-only/grey) + TXT verify |

### Logins (all demo users share one password)
Password: **`Mact-ae6c1fcc9f89!Aj`** — *change this in production.* Stored on the
api service as `SEED_PASSWORD`.

| Email | Role |
| --- | --- |
| `admin@mact.local` | System Administrator |
| `advocate@mact.local` | Senior Advocate |
| `junior@mact.local` | Junior Advocate |
| `staff@mact.local` | Office Staff |
| `readonly@mact.local` | Read-Only User |

---

## 2. Tech stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind, custom
  shadcn-style UI primitives, React Query, lightweight forms.
- **Backend:** NestJS 10, Prisma 5, PostgreSQL, JWT auth, RBAC.
- **Storage:** local disk (driver abstracted for future S3/R2).
- **Repo:** npm **workspaces** monorepo (not pnpm). Node ≥ 20 (built on Node 22).

```
mact-cms/
├─ apps/
│  ├─ api/                 NestJS backend
│  │  ├─ prisma/           schema, migrations, seed, encrypt-existing-pii
│  │  └─ src/
│  │     ├─ auth/ users/ cases/ hearings/ documents/ fees/ expenses/
│  │     ├─ compensation/ settings/ dashboard/ reports/ notifications/ audit/
│  │     ├─ common/        guards, interceptors, decorators, crypto, utils, dto
│  │     └─ prisma/        PrismaService (+ PII encryption middleware)
│  └─ web/                 Next.js frontend
│     └─ src/app/(app)/    dashboard, cases, calculator, fees, reports,
│                          settings, users, audit, calendar
├─ Dockerfile.api  Dockerfile.web   (Railway build per service)
├─ docs/er-diagram.md      Mermaid ER diagram
├─ DEPLOY.md  HANDOFF.md  README.md
```

---

## 3. Local development

```bash
# Prereqs: Node ≥20, PostgreSQL running locally
git clone https://github.com/Rajtaya/mact-cms && cd mact-cms
npm install

# DB
createdb mact_cms
cp apps/api/.env.example apps/api/.env      # then edit DATABASE_URL + secrets
#   ENCRYPTION_KEY is required for PII encryption — generate: openssl rand -hex 32

npm run prisma:generate
npm run prisma:migrate         # applies migrations
npm run db:seed                # creates demo users + master data + demo case

# Run (two terminals)
npm run dev:api                # NestJS on :4000  (Swagger at /api/docs in dev only)
npm run dev:web                # Next.js on :3000

# Tests
cd apps/api && npx jest        # 29 unit tests (compensation engine + masking)
```

The web dev server proxies `/api/*` → `http://localhost:4000` (via `next.config.mjs`
rewrites, using `API_URL`).

---

## 4. Environment variables

### api service
| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (`${{Postgres.DATABASE_URL}}` on Railway) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing (long random) |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `15m` / `7d` |
| `ENCRYPTION_KEY` | **64 hex chars (32 bytes).** AES key for PII at rest. **Load-bearing — if lost, encrypted Aadhaar/PAN/bank cannot be decrypted.** Back it up. |
| `SEED_PASSWORD` | password the seed assigns to demo users |
| `FRONTEND_URL` | allowed CORS origin(s), comma-separated |
| `NODE_ENV` | `production` (disables Swagger, enables Secure cookies) |
| `STORAGE_DRIVER` / `UPLOAD_DIR` / `MAX_UPLOAD_MB` | `local` / `/data/uploads` / `25` |
| `RAILWAY_DOCKERFILE_PATH` | `Dockerfile.api` |
| `PORT` | injected by Railway |

### web service
| Var | Purpose |
| --- | --- |
| `API_URL` | API base URL — **must be present at build time** (Docker ARG); Next bakes the proxy target |
| `RAILWAY_DOCKERFILE_PATH` | `Dockerfile.web` |
| `PORT` | injected by Railway |

---

## 5. Deployment (Railway)

Two services build from the **repo root** via root Dockerfiles selected by the
`RAILWAY_DOCKERFILE_PATH` variable (this avoids the npm-workspace pitfalls of
Railpack — see "Gotchas").

```bash
# From repo root, deploy a service:
railway up --service api --detach
railway up --service web --detach

# Status / logs
railway service status --service api
railway logs --service api

# Custom domain
railway domain <name> --service web
```

- **Migrations** run automatically: `Dockerfile.api`'s start command is
  `npx prisma migrate deploy && node dist/main.js`, so pushing a new migration
  + redeploying the api applies it on boot.
- **Seeding prod** (one-off):
  ```bash
  SEED_PASSWORD=<pw> DATABASE_URL="$(railway variables -s Postgres --json | jq -r .DATABASE_PUBLIC_URL)" \
    npx ts-node apps/api/prisma/seed.ts
  ```

### Gotchas (learned the hard way — don't repeat)
1. **`railway up` uploads the whole monorepo** → Railpack sees 2 workspace
   packages and fails. Fix = root Dockerfiles + `RAILWAY_DOCKERFILE_PATH`.
2. **Next.js bakes `rewrites()` at build time** → `API_URL` must be a Docker
   `ARG` in `Dockerfile.web`, or the `/api` proxy falls back to `localhost:4000`.
3. **`railway config` (IaC) is broken** with the current SDK (planned to delete
   the whole project). **Do not use it.** Manage via CLI + Dockerfiles.
4. **`<input type="date">` sends date-only strings**; Prisma needs full ISO.
   A global `DateCoercionInterceptor` normalizes these — keep it.

---

## 6. Auth & RBAC

- **JWT**: short access token (15m, in memory on the client) + refresh token
  (7d) delivered as an **httpOnly + Secure + SameSite cookie** (path `/api/auth`).
  Refresh tokens are revocable via the `tokenVersion` column (logout / deactivate
  bumps it).
- **Passwords**: argon2 hashed.
- **Roles**: Administrator, Advocate (Senior), Junior Advocate, Office Staff,
  Read-Only. Enforced server-side by `RolesGuard` + `@Roles()`; mirrored on the
  client by `src/lib/permissions.ts` (UI visibility only — server is source of truth).

Permission matrix highlights: Admin = full; Senior Advocate = full case lifecycle +
fees + reports + audit (masters view-only); Junior = cases + calculator + view fee
balances; Office Staff = data entry + log receipts; Read-Only = view.

---

## 7. Security posture

**Implemented & verified live:**
- PII (Aadhaar/PAN/bank) **encrypted at rest** — AES-256-GCM via a Prisma
  middleware (`src/common/crypto/pii-crypto.ts`); transparently decrypted on read,
  then **masked** (`XXXX-XXXX-1234`) for non-privileged roles by a response interceptor.
- Refresh token in httpOnly cookie (XSS-resistant), `tokenVersion` revocation.
- Login rate-limit 5/min via `ProxyThrottlerGuard` (keys on `X-Forwarded-For` —
  needed because Railway's proxy hides `req.ip`).
- Immutable **audit log** (who/what/old→new/ip/timestamp); viewer is Admin/Senior only.
- helmet, CORS allowlist, `trust proxy`, global validation (whitelist +
  forbidNonWhitelisted → blocks mass-assignment), Prisma-parameterized queries,
  Swagger disabled in prod, normalized error envelope (no stack leakage).

**Open items (see also the security audit in chat history):**
- **H3 — dependencies:** 7 high-severity vulns remain (multer 1.x /
  `@nestjs/platform-express`, transitive lodash, dev-only glob/picomatch/tmp/
  `@nestjs/cli`). Need a **breaking** NestJS 11 / multer 2 upgrade with regression
  testing — *not* yet done.
- **M2 — no row-level authz:** any authenticated user can read any case/document.
  Fine for a single firm; revisit if multi-tenant.
- **M5 — uploads are ephemeral:** `UPLOAD_DIR=/data/uploads` but the api service
  has **no volume**, so uploaded documents are lost on redeploy. Mount a Railway
  volume at `/data` or switch the storage driver to S3/R2.

---

## 8. Feature inventory

| Area | Status |
| --- | --- |
| Auth + 5-role RBAC | ✅ |
| Adaptive dashboard (Senior KPI portfolio vs operational hub + missing-doc index) | ✅ |
| Case management (full aggregate: claimants, victims, vehicles/driver/owner/insurer, respondents, witnesses, accident, claim petition) | ✅ create form + detail tabs |
| Hearings timeline (+ next-hearing roll-forward) | ✅ |
| Documents (upload, categories/folders, tags, search, download) | ✅ |
| **Per-case expense ledger** (categories, recoverable flag, totals) | ✅ |
| Fees (arrangement, payments, printable receipt) | ✅ |
| Compensation calculator (Sarla Verma / Pranay Sethi / Raj Kumar) | ✅ + unit-tested |
| Reports (8 reports, xlsx + pdf export) | ✅ |
| Settings (courts, judges, insurers, police stations, hospitals) | ✅ CRUD |
| Users admin, Audit viewer, Calendar (month/week) | ✅ |
| Notifications + reminders (hearing-tomorrow, insurance-expiry) | ✅ API (cron not yet scheduled) |

**Not built (candidates for next phase):** firm-wide/office expense ledger
(current expenses are per-case only), dedicated `/hearings` feed for the calendar,
case **edit** forms for nested collections (currently managed via sub-resource
endpoints), document PDF preview, S3/R2 upload driver, scheduled reminder cron.

---

## 9. Operational runbook

| Task | Command |
| --- | --- |
| Redeploy api / web | `railway up --service api\|web --detach` (from repo root) |
| Tail logs | `railway logs --service api` |
| Rotate all demo passwords | set `SEED_PASSWORD` on api, then re-run the seed (upsert updates the hash) |
| Encrypt legacy plaintext PII | `ENCRYPTION_KEY=… DATABASE_URL=<public> npx ts-node apps/api/prisma/encrypt-existing-pii.ts` |
| New migration | edit schema → `npm run prisma:migrate` (local) → commit → redeploy api (auto-applies) |
| Connect to prod DB | `railway connect Postgres` |

---

## 10. Key files to know

| File | Why |
| --- | --- |
| `apps/api/prisma/schema.prisma` | the data model (source of truth) |
| `apps/api/src/app.module.ts` | global guards + interceptors (throttle → auth → roles → date-coercion → masking) |
| `apps/api/src/common/crypto/pii-crypto.ts` | PII encryption |
| `apps/api/src/compensation/compensation.calculator.ts` | the legal compensation math |
| `apps/web/src/lib/api.ts` | client token/refresh handling |
| `apps/web/src/lib/permissions.ts` | client RBAC matrix |
| `apps/web/src/app/(app)/cases/[id]/page.tsx` | case detail (all sub-module tabs) |
| `Dockerfile.api` / `Dockerfile.web` | how each service builds on Railway |
| `DEPLOY.md` | deployment specifics |

---

*Handoff prepared after completing all 9 build phases, deployment to a custom
domain, a security audit + hardening pass, and the per-case expense feature.*
