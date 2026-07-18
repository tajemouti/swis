import { z } from 'zod';

export const driverStatusEnum = z.enum(['ACTIVE', 'SUSPENDED']);

export const createDriverSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  licenseNumber: z.string().min(1).max(50),
  licenseExpiry: z.coerce.date(),
  phone: z.string().min(1).max(30),
  status: driverStatusEnum.optional().default('ACTIVE'),
  userId: z.string().uuid().optional(),
});
export type CreateDriverDto = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = createDriverSchema.partial();
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;

export const listDriversQuerySchema = z.object({
  status: driverStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type ListDriversQueryDto = z.infer<typeof listDriversQuerySchema>;

export const createViolationSchema = z.object({
  type: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  occurredAt: z.coerce.date(),
});
export type CreateViolationDto = z.infer<typeof createViolationSchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
});
