# SWIS Backend

Smart Waste Information System — Operational backend (Node.js + Express + TypeScript + PostgreSQL/PostGIS).

Architecture: Clean Architecture, feature-based modules.

## Sprint 1 — Foundation (this branch)

Implements: environment config, Prisma schema (users/roles/permissions/refresh
tokens/audit logs), JWT + refresh token auth with rotation, RBAC middleware,
error handling, rate limiting, and the seed script for the 6 roles + default
admin.

### Prerequisites
- Node.js 20+
- Docker (for Postgres/PostGIS + Redis)

### Setup

```bash
cp .env.example .env
# edit .env — set real values for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (32+ chars each)

npm install

docker compose -f docker/docker-compose.dev.yml up -d

npx prisma migrate dev --name init
npm run prisma:seed

npm run dev
```

Server starts on `http://localhost:4000`. Health check: `GET /health`.

### Try it

```bash
# Login with the seeded admin
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swis.local","password":"ChangeMe123!"}'

# Use the returned accessToken
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Scripts
- `npm run dev` — hot-reload dev server
- `npm run build` / `npm start` — production build + run
- `npm run lint` / `npm run format`
- `npm test`
- `npm run prisma:studio` — visual DB browser

