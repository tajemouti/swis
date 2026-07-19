import { Request, Response } from 'express';
import { gpsTrackingService } from './gps-tracking.service';

export const gpsTrackingController = {
  async getLive(_req: Request, res: Response) {
    const positions = await gpsTrackingService.getLivePositions();
    res.status(200).json({ success: true, data: positions });
  },
};
