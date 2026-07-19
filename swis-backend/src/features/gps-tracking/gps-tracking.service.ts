import { gpsTrackingRepository } from './gps-tracking.repository';
import { Prisma } from '@prisma/client';

type LivePositionWithVehicle = Prisma.VehiclePositionGetPayload<{
  include: { vehicle: { select: { id: true; plateNumber: true; status: true; vehicleType: true } } };
}>;

class GpsTrackingService {
  async getLivePositions() {
    const positions = await gpsTrackingRepository.findAllLivePositions();
    return positions.map((p: LivePositionWithVehicle) => ({
      vehicleId: p.vehicleId,
      plateNumber: p.vehicle.plateNumber,
      vehicleStatus: p.vehicle.status,
      vehicleType: p.vehicle.vehicleType.name,
      latitude: p.latitude,
      longitude: p.longitude,
      speed: p.speedKmh,
      heading: p.heading,
      recordedAt: p.recordedAt,
    }));
  }
}

export const gpsTrackingService = new GpsTrackingService();
