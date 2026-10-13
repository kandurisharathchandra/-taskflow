import type { Response } from 'express';

/**
 * Every API response uses one of two shapes:
 *   success: { success: true, data, meta? }
 *   failure: { success: false, error: { code, message, details? } }
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  return res.status(statusCode).json(meta ? { success: true, data, meta } : { success: true, data });
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: unknown) {
  return res.status(statusCode).json({
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  });
}
