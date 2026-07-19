import { Request, Response } from 'express';
import { routesService } from './routes.service';

export const routesController = {
  async list(req: Request, res: Response) {
    const result = await routesService.list(req.query as never);
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  },

  async getById(req: Request, res: Response) {
    const route = await routesService.getById(req.params.id);
    res.status(200).json({ success: true, data: route });
  },

  async create(req: Request, res: Response) {
    const route = await routesService.create(req.body);
    res.status(201).json({ success: true, data: route });
  },

  async update(req: Request, res: Response) {
    const route = await routesService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: route });
  },

  async remove(req: Request, res: Response) {
    await routesService.delete(req.params.id);
    res.status(204).send();
  },

  async updateStatus(req: Request, res: Response) {
    const route = await routesService.updateStatus(req.params.id, req.body);
    res.status(200).json({ success: true, data: route });
  },

  async updateStopStatus(req: Request, res: Response) {
    const stop = await routesService.updateStopStatus(req.params.id, req.params.stopId, req.body);
    res.status(200).json({ success: true, data: stop });
  },
};
