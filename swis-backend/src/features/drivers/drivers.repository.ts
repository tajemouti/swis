import { Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { CreateDriverDto, CreateViolationDto, ListDriversQueryDto, UpdateDriverDto } from './drivers.dto';

export class DriversRepository {
  async findMany(query: ListDriversQueryDto) {
    const where: Prisma.DriverWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { licenseNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.driver.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.driver.findFirst({
      where: { id, deletedAt: null },
      include: { violations: { orderBy: { occurredAt: 'desc' } } },
    });
  }

  findByLicenseNumber(licenseNumber: string) {
    return prisma.driver.findFirst({ where: { licenseNumber, deletedAt: null } });
  }

  findByUserId(userId: string) {
    return prisma.driver.findFirst({ where: { userId, deletedAt: null } });
  }

  create(dto: CreateDriverDto) {
    return prisma.driver.create({ data: dto });
  }

  update(id: string, dto: UpdateDriverDto) {
    return prisma.driver.update({ where: { id }, data: dto });
  }

  softDelete(id: string) {
    return prisma.driver.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  addViolation(driverId: string, dto: CreateViolationDto) {
    return prisma.driverViolation.create({
      data: { driverId, type: dto.type, description: dto.description, occurredAt: dto.occurredAt },
    });
  }

  listViolations(driverId: string) {
    return prisma.driverViolation.findMany({
      where: { driverId },
      orderBy: { occurredAt: 'desc' },
    });
  }
}

export const driversRepository = new DriversRepository();
