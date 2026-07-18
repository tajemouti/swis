import { ConflictError, NotFoundError } from '@shared/domain/errors/app-error';
import { driversRepository } from './drivers.repository';
import { CreateDriverDto, CreateViolationDto, ListDriversQueryDto, UpdateDriverDto } from './drivers.dto';

class DriversService {
  async list(query: ListDriversQueryDto) {
    const { items, total } = await driversRepository.findMany(query);
    return { data: items, meta: { page: query.page, limit: query.limit, total } };
  }

  async getById(id: string) {
    const driver = await driversRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }
    return driver;
  }

  async create(dto: CreateDriverDto) {
    const existingLicense = await driversRepository.findByLicenseNumber(dto.licenseNumber);
    if (existingLicense) {
      throw new ConflictError(`Driver with license number "${dto.licenseNumber}" already exists`);
    }

    if (dto.userId) {
      const existingUserLink = await driversRepository.findByUserId(dto.userId);
      if (existingUserLink) {
        throw new ConflictError('This user account is already linked to another driver');
      }
    }

    return driversRepository.create(dto);
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.getById(id);

    if (dto.licenseNumber) {
      const existing = await driversRepository.findByLicenseNumber(dto.licenseNumber);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Driver with license number "${dto.licenseNumber}" already exists`);
      }
    }

    if (dto.userId) {
      const existingUserLink = await driversRepository.findByUserId(dto.userId);
      if (existingUserLink && existingUserLink.id !== id) {
        throw new ConflictError('This user account is already linked to another driver');
      }
    }

    return driversRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    await driversRepository.softDelete(id);
  }

  async addViolation(driverId: string, dto: CreateViolationDto) {
    await this.getById(driverId);
    return driversRepository.addViolation(driverId, dto);
  }

  async listViolations(driverId: string) {
    await this.getById(driverId);
    return driversRepository.listViolations(driverId);
  }
}

export const driversService = new DriversService();
