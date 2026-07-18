# SWIS Backend

Smart Waste Information System — Operational backend (Node.js + Express + TypeScript + PostgreSQL/PostGIS).

Architecture: Clean Architecture, feature-based modules.

## Sprint 1 — Foundation

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
# if port 5432 is already taken by a local Postgres install, remap the host
# port in docker/docker-compose.dev.yml (e.g. "5433:5432") and update
# DATABASE_URL in .env to match

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

## Sprint 2 — Fleet (Vehicles + Drivers)

Implements: `VehicleType`, `Vehicle`, `Driver`, and `DriverViolation` Prisma
models, and two full feature modules (DTO → repository → service →
controller → routes) following the same Clean Architecture pattern as Auth.

- **Vehicles**: CRUD, vehicle types, soft delete, plate-number uniqueness,
  vehicle-type existence validation.
- **Drivers**: CRUD, soft delete, license-number uniqueness, optional link to
  a `User` account (one-to-one, enforced unique), violation tracking.
- All endpoints are protected by `authMiddleware` + `requirePermission(...)`,
  matching the RBAC matrix from the design doc.

### Setup (additive to Sprint 1)

```bash
npx prisma migrate dev --name add_fleet_models
npm run dev
```

### Try it

```bash
# Create a vehicle type
curl -X POST http://localhost:4000/api/v1/vehicles/vehicle-types \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"compactor","capacityKg":8000}'

# Create a vehicle (use the vehicleTypeId returned above)
curl -X POST http://localhost:4000/api/v1/vehicles \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber":"12345-A-6","vehicleTypeId":"<vehicleTypeId>","fuelCapacity":200}'

# List vehicles
curl http://localhost:4000/api/v1/vehicles -H "Authorization: Bearer <accessToken>"

# Create a driver
curl -X POST http://localhost:4000/api/v1/drivers \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Karim","lastName":"Alaoui","licenseNumber":"LIC-001","licenseExpiry":"2027-01-01","phone":"0600000000"}'
```

Duplicate `plateNumber` or `licenseNumber` return `409 CONFLICT`.
An invalid `vehicleTypeId` on vehicle creation returns `400 VALIDATION_ERROR`.

### Scripts
- `npm run dev` — hot-reload dev server
- `npm run build` / `npm start` — production build + run
- `npm run lint` / `npm run format`
- `npm test`
- `npm run prisma:studio` — visual DB browser