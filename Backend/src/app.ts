import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

// Built separately from server.ts so tests can drive the app with Supertest without opening a port.
export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
