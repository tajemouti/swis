import { Prisma, RouteStatus, StopStatus } from '@prisma/client';
import { prisma } from '@config/database';
import { CreateRouteDto, ListRoutesQueryDto, UpdateRouteDto } from './routes.dto';

export class RoutesRepository {
  async findMany(query: ListRoutesQueryDto) {
    const where: Prisma.RouteWhereInput = {
      deletedAt: null,
      ...(query.date && { scheduledDate: query.date }),
      ...(query.status && { status: query.status }),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(query.driverId && { driverId: query.driverId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.route.findMany({
        where,
        include: {
          vehicle: { select: { id: true, plateNumber: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { stops: true } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { scheduledDate: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.route.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        stops: {
          include: { container: true },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Creates a route and its ordered stops atomically. If any container ID is
   * invalid, or the vehicle/driver don't exist, Prisma throws inside the
   * transaction and nothing is persisted.
   */
  createWithStops(dto: CreateRouteDto) {
    return prisma.route.create({
      data: {
        name: dto.name,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        scheduledDate: dto.scheduledDate,
        shift: dto.shift,
        stops: {
          create: dto.stops.map((containerId, index) => ({
            containerId,
            sequenceOrder: index + 1,
          })),
        },
      },
      include: {
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        stops: { include: { container: true }, orderBy: { sequenceOrder: 'asc' } },
      },
    });
  }

  update(id: string, dto: UpdateRouteDto) {
    return prisma.route.update({
      where: { id },
      data: dto,
      include: {
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  updateStatus(id: string, status: RouteStatus) {
    const timestampField =
      status === 'IN_PROGRESS'
        ? { startTime: new Date() }
        : status === 'COMPLETED'
          ? { endTime: new Date() }
          : {};

    return prisma.route.update({
      where: { id },
      data: { status, ...timestampField },
    });
  }

  softDelete(id: string) {
    return prisma.route.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findStopById(routeId: string, stopId: string) {
    return prisma.stop.findFirst({ where: { id: stopId, routeId } });
  }

  updateStopStatus(stopId: string, status: StopStatus) {
    const timestampField =
      status === 'COLLECTED'
        ? { collectedAt: new Date(), arrivedAt: new Date() }
        : status === 'MISSED'
          ? { arrivedAt: new Date() }
          : {};

    return prisma.stop.update({
      where: { id: stopId },
      data: { status, ...timestampField },
      include: { container: true },
    });
  }

  countContainersExisting(containerIds: string[]) {
    return prisma.container.count({
      where: { id: { in: containerIds }, deletedAt: null },
    });
  }

  findVehicleActive(vehicleId: string) {
    return prisma.vehicle.findFirst({ where: { id: vehicleId, deletedAt: null } });
  }

  findDriverActive(driverId: string) {
    return prisma.driver.findFirst({ where: { id: driverId, deletedAt: null } });
  }
}

export const routesRepository = new RoutesRepository();
