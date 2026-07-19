import { Request, Response } from 'express';
import { containersService } from './containers.service';

export const containersController = {
  async list(req: Request, res: Response) {
    const result = await containersService.list(req.query as never);
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  },

  async getById(req: Request, res: Response) {
    const container = await containersService.getById(req.params.id);
    res.status(200).json({ success: true, data: container });
  },

  async create(req: Request, res: Response) {
    const container = await containersService.create(req.body);
    res.status(201).json({ success: true, data: container });
  },

  async update(req: Request, res: Response) {
    const container = await containersService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: container });
  },

  async remove(req: Request, res: Response) {
    await containersService.delete(req.params.id);
    res.status(204).send();
  },
};
