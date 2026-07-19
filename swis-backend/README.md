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

## Sprint 3 — Live GPS Tracking

Implements a simulated live-tracking pipeline: a `VehiclePosition` table
(latest known position per vehicle), a GPS simulator that moves every
`ACTIVE` vehicle automatically on server start, and a Socket.io layer that
broadcasts each position update in real time.

- **`VehiclePosition`** (Prisma) — one row per vehicle (upsert), latitude/
  longitude/speed/heading/recordedAt.
- **GPS simulator** (`gps-simulator.service.ts`) — ticks every 3 seconds,
  moves each active vehicle with a bounded random walk (heading and speed
  drift gently instead of jumping) inside a default Casablanca-area
  bounding box. Runs independently of Routes, which arrive in Sprint 4.
- **Socket.io** (`config/socket.ts`) — requires a valid JWT access token in
  `socket.handshake.auth.token`; rejects the connection otherwise. Broadcasts
  a `vehicle:position` event on every tick.
- **`GET /api/v1/tracking/live`** — REST endpoint for the initial page load
  (before the first socket broadcast arrives); Socket.io handles all
  updates after that.

### Setup (additive to Sprints 1–2)

```bash
npx prisma migrate dev --name add_vehicle_positions
npm run dev
```

The simulator starts automatically with the server — no separate command
needed. It only moves vehicles with `status: ACTIVE`, so make sure at least
one exists (see Sprint 2 above).

### Try it

**REST (initial load) — wait ~10s after server start so the simulator has
ticked a few times:**
```bash
curl http://localhost:4000/api/v1/tracking/live -H "Authorization: Bearer <accessToken>"
```

**Socket.io (live updates):**
```bash
npm install --no-save socket.io-client
```
```js
// test-socket.js
const { io } = require('socket.io-client');
const socket = io('http://localhost:4000', { auth: { token: '<accessToken>' } });
socket.on('connect', () => console.log('Connected!'));
socket.on('vehicle:position', (data) => console.log('Position update:', data));
socket.on('connect_error', (err) => console.log('Connection error:', err.message));
```
```bash
node test-socket.js
```
You should see a position update roughly every 3 seconds for each active
vehicle. Connecting without a token, or with an expired one, should trigger
`connect_error`.

### Scripts
- `npm run dev` — hot-reload dev server
- `npm run build` / `npm start` — production build + run
- `npm run lint` / `npm run format`
- `npm test`
- `npm run prisma:studio` — visual DB browser

## Sprint 4 — Routes Management

Implements route planning and execution: routes are assigned to a vehicle
and a driver, carry an ordered list of stops (containers to collect), and
move through a controlled status lifecycle.

- **`Container`** (Prisma) — minimal model for now (code, lat/lng, zone).
  Expanded with RFID, capacity, and collection frequency in Sprint 5.
- **`Route`** — name, vehicle, driver, scheduled date, shift
  (`MORNING`/`EVENING`), status (`PLANNED → IN_PROGRESS → COMPLETED`, or
  `CANCELLED` from either of the first two).
- **`Stop`** — one per container on a route, with `sequenceOrder`, status
  (`PENDING → COLLECTED`/`MISSED`).
- **Containers module** — standard CRUD, code uniqueness enforced.
- **Routes module** — creation is transactional (route + all stops created
  together; if any container ID is invalid, nothing is persisted).
  Business rules enforced at the service layer:
  - Vehicle and driver must exist and be active
  - No duplicate containers within the same route
  - Routes can only be edited while `PLANNED`
  - Status transitions follow a fixed state machine (no skipping states,
    no reopening `COMPLETED`/`CANCELLED`)
  - Stops can only be updated while the parent route is `IN_PROGRESS`,
    and only once (no re-marking an already-collected stop)

### Setup (additive to Sprints 1–3)

```bash
npx prisma migrate dev --name add_routes_management
npm run dev
```

### Try it

```bash
# Create a container
curl -X POST http://localhost:4000/api/v1/containers \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"code":"CTN-001","latitude":33.57,"longitude":-7.60,"zone":"Zone A"}'

# Create a route (use real vehicleId / driverId / containerId values)
curl -X POST http://localhost:4000/api/v1/routes \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Zone A Morning",
    "vehicleId":"<vehicleId>",
    "driverId":"<driverId>",
    "scheduledDate":"2026-07-20",
    "shift":"MORNING",
    "stops":["<containerId>"]
  }'

# Start the route
curl -X PATCH http://localhost:4000/api/v1/routes/<routeId>/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'

# Mark a stop as collected (only works while route is IN_PROGRESS)
curl -X PATCH http://localhost:4000/api/v1/routes/<routeId>/stops/<stopId> \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"COLLECTED"}'

# Complete the route
curl -X PATCH http://localhost:4000/api/v1/routes/<routeId>/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}'
```

Invalid transitions (e.g. `PLANNED → COMPLETED` directly, or updating a
stop on a `PLANNED` route) return `400 VALIDATION_ERROR` with a message
explaining the allowed transitions.

### Scripts
- `npm run dev` — hot-reload dev server
- `npm run build` / `npm start` — production build + run
- `npm run lint` / `npm run format`
- `npm test`
- `npm run prisma:studio` — visual DB browser
