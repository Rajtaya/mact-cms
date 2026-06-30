# Deployment — Railway

The app deploys as **two Railway services** from this one repo, plus a
PostgreSQL plugin:

| Service | Root directory | Notes |
| ------- | -------------- | ----- |
| `api`   | `apps/api`     | NestJS. Runs `prisma migrate deploy` on boot. |
| `web`   | `apps/web`     | Next.js 15. Proxies `/api/*` → the api service. |
| Postgres | —             | Railway plugin; provides `DATABASE_URL`. |

## Required environment variables

**api**
- `DATABASE_URL` — reference the Postgres plugin (`${{Postgres.DATABASE_URL}}`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings
- `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`
- `FRONTEND_URL` — the web service public URL (for CORS)
- `NODE_ENV=production`

**web**
- `API_URL` — the api service public URL

## First deploy

```bash
railway init                 # create / link the project
railway add --database postgres
# create the two services with root dirs apps/api and apps/web,
# set the env vars above, then:
railway up
```

After the first successful api deploy, seed master data + users once:

```bash
railway run --service api npm run db:seed
```

Default login after seed: `admin@mact.local` / `Password@123`
(change immediately in production).
