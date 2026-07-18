import { ConflictError, NotFoundError, ValidationError } from '@shared/domain/errors/app-error';
import { vehiclesRepository } from './vehicles.repository';
import {
  CreateVehicleDto,
  CreateVehicleTypeDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from './vehicles.dto';

class VehiclesService {
  async list(query: ListVehiclesQueryDto) {
    const { items, total } = await vehiclesRepository.findMany(query);
    return {
      data: items,
      meta: { page: query.page, limit: query.limit, total },
    };
  }

  async getById(id: string) {
    const vehicle = await vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const existing = await vehiclesRepository.findByPlateNumber(dto.plateNumber);
    if (existing) {
      throw new ConflictError(`Vehicle with plate number "${dto.plateNumber}" already exists`);
    }

    const vehicleType = await vehiclesRepository.findVehicleTypeById(dto.vehicleTypeId);
    if (!vehicleType) {
      throw new ValidationError('Invalid vehicleTypeId — no matching vehicle type found');
    }

    return vehiclesRepository.create(dto);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.getById(id); // throws NotFoundError if missing

    if (dto.plateNumber) {
      const existing = await vehiclesRepository.findByPlateNumber(dto.plateNumber);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Vehicle with plate number "${dto.plateNumber}" already exists`);
      }
    }

    if (dto.vehicleTypeId) {
      const vehicleType = await vehiclesRepository.findVehicleTypeById(dto.vehicleTypeId);
      if (!vehicleType) {
        throw new ValidationError('Invalid vehicleTypeId — no matching vehicle type found');
      }
    }

    return vehiclesRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    await vehiclesRepository.softDelete(id);
  }

  listVehicleTypes() {
    return vehiclesRepository.findVehicleTypes();
  }

  async createVehicleType(dto: CreateVehicleTypeDto) {
    return vehiclesRepository.createVehicleType(dto.name, dto.capacityKg);
  }
}

export const vehiclesService = new VehiclesService();
