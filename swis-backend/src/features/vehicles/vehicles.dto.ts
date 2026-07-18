import { z } from 'zod';

export const vehicleStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'OFFLINE', 'RETIRED']);

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').max(20),
  vehicleTypeId: z.string().uuid(),
  status: vehicleStatusEnum.optional().default('ACTIVE'),
  currentMileage: z.number().nonnegative().optional().default(0),
  fuelCapacity: z.number().positive('Fuel capacity must be greater than 0'),
  purchaseDate: z.coerce.date().optional(),
});
export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial();
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;

export const listVehiclesQuerySchema = z.object({
  status: vehicleStatusEnum.optional(),
  vehicleTypeId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type ListVehiclesQueryDto = z.infer<typeof listVehiclesQuerySchema>;

export const createVehicleTypeSchema = z.object({
  name: z.string().min(1).max(50),
  capacityKg: z.number().positive(),
});
export type CreateVehicleTypeDto = z.infer<typeof createVehicleTypeSchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
});
