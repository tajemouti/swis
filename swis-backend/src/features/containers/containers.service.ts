import { ConflictError, NotFoundError } from '@shared/domain/errors/app-error';
import { containersRepository } from './containers.repository';
import { CreateContainerDto, ListContainersQueryDto, UpdateContainerDto } from './containers.dto';

class ContainersService {
  async list(query: ListContainersQueryDto) {
    const { items, total } = await containersRepository.findMany(query);
    return { data: items, meta: { page: query.page, limit: query.limit, total } };
  }

  async getById(id: string) {
    const container = await containersRepository.findById(id);
    if (!container) {
      throw new NotFoundError('Container');
    }
    return container;
  }

  async create(dto: CreateContainerDto) {
    const existing = await containersRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictError(`Container with code "${dto.code}" already exists`);
    }
    return containersRepository.create(dto);
  }

  async update(id: string, dto: UpdateContainerDto) {
    await this.getById(id);
    if (dto.code) {
      const existing = await containersRepository.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Container with code "${dto.code}" already exists`);
      }
    }
    return containersRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    await containersRepository.softDelete(id);
  }
}

export const containersService = new ContainersService();
