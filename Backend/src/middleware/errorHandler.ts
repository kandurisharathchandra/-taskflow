import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    sendError(res, 400, 'VALIDATION_ERROR', details[0]?.message ?? 'Invalid request', details);
    return;
  }

  // Malformed JSON bodies, raised by express.json().
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON');
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    sendError(res, 404, 'NOT_FOUND', 'Task not found');
    return;
  }

  // Anything else is unexpected: log it, but never leak internals to the client.
  console.error(err);
  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(res, 503, 'DATABASE_UNAVAILABLE', 'The database is unavailable. Please try again later.');
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again later.');
};
