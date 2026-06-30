# MACT Case Management System

Enterprise-grade case management for advocates handling **Motor Accident Claims
Tribunal (MACT)** litigation in India. Built like ERP software — modular,
role-secured, fully auditable.

## Tech stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Frontend  | Next.js 15 (App Router), React, TypeScript, Tailwind, shadcn/ui, RHF + Zod |
| Backend   | NestJS, Prisma ORM, PostgreSQL, JWT auth, RBAC                      |
| Storage   | Local disk now; pluggable driver for AWS S3 / Cloudflare R2 later   |

## Monorepo layout

```
mact-cms/
├─ apps/
│  ├─ api/        NestJS backend
│  │  └─ prisma/  schema, migrations, seed
│  └─ web/        Next.js 15 frontend
└─ package.json   npm workspaces root
```

## Roles & access

| Role             | Capability summary                                                  |
| ---------------- | ------------------------------------------------------------------- |
| Administrator    | Full access incl. users, roles, settings, audit logs                |
| Advocate         | Full case lifecycle, hearings, fees, documents, reports             |
| Junior Advocate  | Edit assigned cases, hearings, documents; no fee/settings/user mgmt |
| Office Staff     | Data entry, documents, scheduling; no financial/legal sign-off      |
| Read Only User   | View dashboards, cases, reports; no writes                          |

## Build phases

- **Phase 1 — Database schema & ER diagram** ✅ (this commit)
- **Phase 2** — Backend APIs (NestJS modules per domain)
- **Phase 3** — Frontend UI shell (layout, theming, navigation)
- **Phase 4** — Authentication & RBAC
- **Phase 5** — Case management (full case aggregate)
- **Phase 6** — Hearings (timeline)
- **Phase 7** — Documents (upload, preview, tags, search)
- **Phase 8** — Reports (PDF/Excel export)
- **Phase 9** — Testing & hardening

## Getting started (Phase 1)

```bash
# 1. Install deps
npm install

# 2. Configure DB
cp apps/api/.env.example apps/api/.env   # then edit DATABASE_URL

# 3. Generate client + run the first migration
npm run prisma:generate
npm run prisma:migrate        # creates tables from schema.prisma

# 4. Inspect the schema visually
npm run prisma:studio
```

## Data model overview

`Case` is the aggregate root. Detail blocks attach as 1:1 (claim petition,
accident) or 1:N (claimants, victims, vehicles, respondents, witnesses,
hearings, documents, compensation estimates). Each **offending vehicle** carries
its own driver, owner and insurer — matching real MACT pleadings. Money is
`Decimal(14,2)`; every mutation is captured in `AuditLog`. See
[`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) and the ER
diagram in `docs/`.
