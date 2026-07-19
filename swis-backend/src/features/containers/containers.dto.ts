import { z } from 'zod';

export const createContainerSchema = z.object({
  code: z.string().min(1).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zone: z.string().max(100).optional(),
});
export type CreateContainerDto = z.infer<typeof createContainerSchema>;

export const updateContainerSchema = createContainerSchema.partial();
export type UpdateContainerDto = z.infer<typeof updateContainerSchema>;

export const listContainersQuerySchema = z.object({
  zone: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type ListContainersQueryDto = z.infer<typeof listContainersQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
});
