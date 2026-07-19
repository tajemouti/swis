import { prisma } from '@config/database';

export interface PositionUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
}

export class GpsTrackingRepository {
  async upsertPosition(update: PositionUpdate) {
    return prisma.vehiclePosition.upsert({
      where: { vehicleId: update.vehicleId },
      create: {
        vehicleId: update.vehicleId,
        latitude: update.latitude,
        longitude: update.longitude,
        speedKmh: update.speedKmh,
        heading: update.heading,
        recordedAt: new Date(),
      },
      update: {
        latitude: update.latitude,
        longitude: update.longitude,
        speedKmh: update.speedKmh,
        heading: update.heading,
        recordedAt: new Date(),
      },
    });
  }

  async findAllLivePositions() {
    return prisma.vehiclePosition.findMany({
      include: {
        vehicle: {
          select: { id: true, plateNumber: true, status: true, vehicleType: true },
        },
      },
    });
  }

  async findActiveVehicles() {
    return prisma.vehicle.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, plateNumber: true },
    });
  }

  async findPositionByVehicleId(vehicleId: string) {
    return prisma.vehiclePosition.findUnique({ where: { vehicleId } });
  }
}

export const gpsTrackingRepository = new GpsTrackingRepository();
