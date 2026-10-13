import type { Request, Response } from 'express';
import { getDashboardStats } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';
import { dashboardStatsQuerySchema } from '../validators/dashboard.validators.js';

export async function getStats(req: Request, res: Response) {
  const { today } = dashboardStatsQuerySchema.parse(req.query);
  sendSuccess(res, await getDashboardStats(today));
}
