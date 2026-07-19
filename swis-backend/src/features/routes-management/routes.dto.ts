import { z } from 'zod';

export const routeStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const shiftEnum = z.enum(['MORNING', 'EVENING']);
export const stopStatusEnum = z.enum(['PENDING', 'COLLECTED', 'MISSED']);

export const createRouteSchema = z.object({
  name: z.string().min(1).max(150),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  scheduledDate: z.coerce.date(),
  shift: shiftEnum,
  // Ordered list of container IDs — sequenceOrder is derived from array position.
  stops: z.array(z.string().uuid()).min(1, 'A route needs at least one stop'),
});
export type CreateRouteDto = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  scheduledDate: z.coerce.date().optional(),
  shift: shiftEnum.optional(),
});
export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;

export const updateRouteStatusSchema = z.object({
  status: routeStatusEnum,
});
export type UpdateRouteStatusDto = z.infer<typeof updateRouteStatusSchema>;

export const updateStopSchema = z.object({
  status: stopStatusEnum,
});
export type UpdateStopDto = z.infer<typeof updateStopSchema>;

export const listRoutesQuerySchema = z.object({
  date: z.coerce.date().optional(),
  status: routeStatusEnum.optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type ListRoutesQueryDto = z.infer<typeof listRoutesQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
});

export const routeStopParamsSchema = z.object({
  id: z.string().uuid('Invalid route id format'),
  stopId: z.string().uuid('Invalid stop id format'),
});
