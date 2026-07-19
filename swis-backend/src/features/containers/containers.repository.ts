import { Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { CreateContainerDto, ListContainersQueryDto, UpdateContainerDto } from './containers.dto';

export class ContainersRepository {
  async findMany(query: ListContainersQueryDto) {
    const where: Prisma.ContainerWhereInput = {
      deletedAt: null,
      ...(query.zone && { zone: query.zone }),
      ...(query.search && { code: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.container.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.container.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.container.findFirst({ where: { id, deletedAt: null } });
  }

  findByCode(code: string) {
    return prisma.container.findFirst({ where: { code, deletedAt: null } });
  }

  create(dto: CreateContainerDto) {
    return prisma.container.create({ data: dto });
  }

  update(id: string, dto: UpdateContainerDto) {
    return prisma.container.update({ where: { id }, data: dto });
  }

  softDelete(id: string) {
    return prisma.container.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const containersRepository = new ContainersRepository();
