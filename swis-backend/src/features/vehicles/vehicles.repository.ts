import { Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { CreateVehicleDto, ListVehiclesQueryDto, UpdateVehicleDto } from './vehicles.dto';

export class VehiclesRepository {
  async findMany(query: ListVehiclesQueryDto) {
    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.vehicleTypeId && { vehicleTypeId: query.vehicleTypeId }),
      ...(query.search && {
        plateNumber: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.vehicle.findMany({
        where,
        include: { vehicleType: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: { vehicleType: true },
    });
  }

  findByPlateNumber(plateNumber: string) {
    return prisma.vehicle.findFirst({ where: { plateNumber, deletedAt: null } });
  }

  create(dto: CreateVehicleDto) {
    return prisma.vehicle.create({
      data: {
        plateNumber: dto.plateNumber,
        vehicleTypeId: dto.vehicleTypeId,
        status: dto.status,
        currentMileage: dto.currentMileage,
        fuelCapacity: dto.fuelCapacity,
        purchaseDate: dto.purchaseDate,
      },
      include: { vehicleType: true },
    });
  }

  update(id: string, dto: UpdateVehicleDto) {
    return prisma.vehicle.update({
      where: { id },
      data: dto,
      include: { vehicleType: true },
    });
  }

  softDelete(id: string) {
    return prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findVehicleTypes() {
    return prisma.vehicleType.findMany({ orderBy: { name: 'asc' } });
  }

  findVehicleTypeById(id: string) {
    return prisma.vehicleType.findUnique({ where: { id } });
  }

  createVehicleType(name: string, capacityKg: number) {
    return prisma.vehicleType.create({ data: { name, capacityKg } });
  }
}

export const vehiclesRepository = new VehiclesRepository();
