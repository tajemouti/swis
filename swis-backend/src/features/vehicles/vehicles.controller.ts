import { Request, Response } from 'express';
import { vehiclesService } from './vehicles.service';

export const vehiclesController = {
  async list(req: Request, res: Response) {
    const result = await vehiclesService.list(req.query as never);
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  },

  async getById(req: Request, res: Response) {
    const vehicle = await vehiclesService.getById(req.params.id);
    res.status(200).json({ success: true, data: vehicle });
  },

  async create(req: Request, res: Response) {
    const vehicle = await vehiclesService.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  },

  async update(req: Request, res: Response) {
    const vehicle = await vehiclesService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: vehicle });
  },

  async remove(req: Request, res: Response) {
    await vehiclesService.delete(req.params.id);
    res.status(204).send();
  },

  async listTypes(_req: Request, res: Response) {
    const types = await vehiclesService.listVehicleTypes();
    res.status(200).json({ success: true, data: types });
  },

  async createType(req: Request, res: Response) {
    const type = await vehiclesService.createVehicleType(req.body);
    res.status(201).json({ success: true, data: type });
  },
};
