import { NotFoundError, ValidationError } from '@shared/domain/errors/app-error';
import { routesRepository } from './routes.repository';
import {
  CreateRouteDto,
  ListRoutesQueryDto,
  UpdateRouteDto,
  UpdateRouteStatusDto,
  UpdateStopDto,
} from './routes.dto';
import { RouteStatus } from '@prisma/client';

// Only these transitions are allowed — prevents e.g. reopening a CANCELLED route.
const ALLOWED_TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

class RoutesService {
  async list(query: ListRoutesQueryDto) {
    const { items, total } = await routesRepository.findMany(query);
    return { data: items, meta: { page: query.page, limit: query.limit, total } };
  }

  async getById(id: string) {
    const route = await routesRepository.findById(id);
    if (!route) {
      throw new NotFoundError('Route');
    }
    return route;
  }

  async create(dto: CreateRouteDto) {
    const vehicle = await routesRepository.findVehicleActive(dto.vehicleId);
    if (!vehicle) {
      throw new ValidationError('Invalid vehicleId — no matching active vehicle found');
    }

    const driver = await routesRepository.findDriverActive(dto.driverId);
    if (!driver) {
      throw new ValidationError('Invalid driverId — no matching active driver found');
    }

    const uniqueContainerIds = new Set(dto.stops);
    if (uniqueContainerIds.size !== dto.stops.length) {
      throw new ValidationError('A route cannot contain the same container twice');
    }

    const existingCount = await routesRepository.countContainersExisting(dto.stops);
    if (existingCount !== dto.stops.length) {
      throw new ValidationError('One or more containerIds in stops do not exist');
    }

    return routesRepository.createWithStops(dto);
  }

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.getById(id);

    if (route.status !== 'PLANNED') {
      throw new ValidationError('Only routes in PLANNED status can be edited');
    }

    if (dto.vehicleId) {
      const vehicle = await routesRepository.findVehicleActive(dto.vehicleId);
      if (!vehicle) {
        throw new ValidationError('Invalid vehicleId — no matching active vehicle found');
      }
    }

    if (dto.driverId) {
      const driver = await routesRepository.findDriverActive(dto.driverId);
      if (!driver) {
        throw new ValidationError('Invalid driverId — no matching active driver found');
      }
    }

    return routesRepository.update(id, dto);
  }

  async updateStatus(id: string, dto: UpdateRouteStatusDto) {
    const route = await this.getById(id);

    const allowed = ALLOWED_TRANSITIONS[route.status];
    if (!allowed.includes(dto.status)) {
      throw new ValidationError(
        `Cannot transition route from ${route.status} to ${dto.status}. Allowed: ${
          allowed.length ? allowed.join(', ') : 'none (terminal status)'
        }`,
      );
    }

    return routesRepository.updateStatus(id, dto.status);
  }

  async delete(id: string) {
    const route = await this.getById(id);
    if (route.status === 'IN_PROGRESS') {
      throw new ValidationError('Cannot delete a route that is currently in progress');
    }
    await routesRepository.softDelete(id);
  }

  async updateStopStatus(routeId: string, stopId: string, dto: UpdateStopDto) {
    const route = await this.getById(routeId);
    if (route.status !== 'IN_PROGRESS') {
      throw new ValidationError('Stops can only be updated while the route is IN_PROGRESS');
    }

    const stop = await routesRepository.findStopById(routeId, stopId);
    if (!stop) {
      throw new NotFoundError('Stop');
    }

    if (stop.status !== 'PENDING') {
      throw new ValidationError(`Stop is already marked as ${stop.status}`);
    }

    return routesRepository.updateStopStatus(stopId, dto.status);
  }
}

export const routesService = new RoutesService();
