import { gpsTrackingRepository, PositionUpdate } from './gps-tracking.repository';
import { getSocketServer } from '@config/socket';
import { logger } from '@shared/utils/logger';

// Default simulation bounds: Casablanca metropolitan area.
// Kept as plain constants (not env config) since this is a dev-only simulator,
// easy to swap for real device ingestion later without touching call sites.
const BOUNDS = {
  minLat: 33.52,
  maxLat: 33.6,
  minLng: -7.68,
  maxLng: -7.55,
};

const TICK_INTERVAL_MS = 3000;
const MAX_SPEED_KMH = 60;
const MAX_HEADING_DRIFT_DEG = 25;

interface SimState {
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Moves a lat/lng point by a given distance (km) along a heading (degrees).
 * Approximation is sufficient for simulated on-map movement (not for real navigation).
 */
function moveLatLng(
  lat: number,
  lng: number,
  distanceKm: number,
  headingDeg: number,
): { lat: number; lng: number } {
  const headingRad = (headingDeg * Math.PI) / 180;
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos((lat * Math.PI) / 180);

  const deltaLat = (distanceKm * Math.cos(headingRad)) / kmPerDegreeLat;
  const deltaLng = (distanceKm * Math.sin(headingRad)) / kmPerDegreeLng;

  return { lat: lat + deltaLat, lng: lng + deltaLng };
}

class GpsSimulatorService {
  private states = new Map<string, SimState>();
  private intervalHandle: NodeJS.Timeout | null = null;

  private seedVehicleIfNeeded(vehicleId: string): SimState {
    let state = this.states.get(vehicleId);
    if (!state) {
      state = {
        latitude: randomInRange(BOUNDS.minLat, BOUNDS.maxLat),
        longitude: randomInRange(BOUNDS.minLng, BOUNDS.maxLng),
        heading: randomInRange(0, 360),
        speedKmh: randomInRange(10, MAX_SPEED_KMH),
      };
      this.states.set(vehicleId, state);
    }
    return state;
  }

  private advance(state: SimState): SimState {
    // Gentle random walk: drift heading and speed instead of teleporting,
    // so movement on the map looks continuous rather than jumpy.
    const nextHeading = normalizeHeading(
      state.heading + randomInRange(-MAX_HEADING_DRIFT_DEG, MAX_HEADING_DRIFT_DEG),
    );
    const nextSpeed = clamp(
      state.speedKmh + randomInRange(-8, 8),
      0,
      MAX_SPEED_KMH,
    );

    const distanceKm = (nextSpeed * (TICK_INTERVAL_MS / 1000)) / 3600;
    const { lat, lng } = moveLatLng(state.latitude, state.longitude, distanceKm, nextHeading);

    return {
      latitude: clamp(lat, BOUNDS.minLat, BOUNDS.maxLat),
      longitude: clamp(lng, BOUNDS.minLng, BOUNDS.maxLng),
      heading: nextHeading,
      speedKmh: nextSpeed,
    };
  }

  private async tick(): Promise<void> {
    const activeVehicles = await gpsTrackingRepository.findActiveVehicles();
    if (activeVehicles.length === 0) return;

    const updates: PositionUpdate[] = [];

    for (const vehicle of activeVehicles) {
      const current = this.seedVehicleIfNeeded(vehicle.id);
      const next = this.advance(current);
      this.states.set(vehicle.id, next);

      updates.push({
        vehicleId: vehicle.id,
        latitude: next.latitude,
        longitude: next.longitude,
        speedKmh: next.speedKmh,
        heading: Math.round(next.heading),
      });
    }

    await Promise.all(updates.map((u) => gpsTrackingRepository.upsertPosition(u)));

    try {
      const io = getSocketServer();
      for (const update of updates) {
        io.emit('vehicle:position', {
          vehicleId: update.vehicleId,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speedKmh,
          heading: update.heading,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Socket server not initialized yet (e.g. during startup race) — skip broadcast, DB still updated.
    }
  }

  start(): void {
    if (this.intervalHandle) return;
    logger.info(`Starting GPS simulator (tick every ${TICK_INTERVAL_MS}ms)`);
    this.intervalHandle = setInterval(() => {
      this.tick().catch((err) => logger.error('GPS simulator tick failed', { error: err }));
    }, TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('GPS simulator stopped');
    }
  }
}

export const gpsSimulatorService = new GpsSimulatorService();
