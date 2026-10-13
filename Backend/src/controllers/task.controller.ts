import type { Request, Response } from 'express';
import * as taskService from '../services/task.service.js';
import { sendSuccess } from '../utils/response.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validators/task.validators.js';

// Validation errors thrown by .parse() are turned into 400 responses by the error handler.

export async function listTasks(req: Request, res: Response) {
  const query = listTasksQuerySchema.parse(req.query);
  const { tasks, pagination } = await taskService.listTasks(query);
  sendSuccess(res, tasks, 200, { pagination });
}

export async function getTask(req: Request, res: Response) {
  const { id } = taskIdParamsSchema.parse(req.params);
  sendSuccess(res, await taskService.getTaskById(id));
}

export async function createTask(req: Request, res: Response) {
  const input = createTaskSchema.parse(req.body);
  sendSuccess(res, await taskService.createTask(input), 201);
}

export async function updateTask(req: Request, res: Response) {
  const { id } = taskIdParamsSchema.parse(req.params);
  const input = updateTaskSchema.parse(req.body);
  sendSuccess(res, await taskService.updateTask(id, input));
}

export async function updateTaskStatus(req: Request, res: Response) {
  const { id } = taskIdParamsSchema.parse(req.params);
  const { status } = updateTaskStatusSchema.parse(req.body);
  sendSuccess(res, await taskService.updateTaskStatus(id, status));
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = taskIdParamsSchema.parse(req.params);
  await taskService.deleteTask(id);
  res.status(204).end();
}
