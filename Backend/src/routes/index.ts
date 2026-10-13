import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import * as tasks from '../controllers/task.controller.js';
import { sendSuccess } from '../utils/response.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.get('/tasks', tasks.listTasks);
apiRouter.post('/tasks', tasks.createTask);
apiRouter.get('/tasks/:id', tasks.getTask);
apiRouter.put('/tasks/:id', tasks.updateTask);
apiRouter.patch('/tasks/:id/status', tasks.updateTaskStatus);
apiRouter.delete('/tasks/:id', tasks.deleteTask);

apiRouter.get('/dashboard/stats', getStats);
