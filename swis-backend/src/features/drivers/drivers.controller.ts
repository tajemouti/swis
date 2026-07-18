import { Request, Response } from 'express';
import { driversService } from './drivers.service';

export const driversController = {
  async list(req: Request, res: Response) {
    const result = await driversService.list(req.query as never);
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  },

  async getById(req: Request, res: Response) {
    const driver = await driversService.getById(req.params.id);
    res.status(200).json({ success: true, data: driver });
  },

  async create(req: Request, res: Response) {
    const driver = await driversService.create(req.body);
    res.status(201).json({ success: true, data: driver });
  },

  async update(req: Request, res: Response) {
    const driver = await driversService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: driver });
  },

  async remove(req: Request, res: Response) {
    await driversService.delete(req.params.id);
    res.status(204).send();
  },

  async listViolations(req: Request, res: Response) {
    const violations = await driversService.listViolations(req.params.id);
    res.status(200).json({ success: true, data: violations });
  },

  async addViolation(req: Request, res: Response) {
    const violation = await driversService.addViolation(req.params.id, req.body);
    res.status(201).json({ success: true, data: violation });
  },
};
