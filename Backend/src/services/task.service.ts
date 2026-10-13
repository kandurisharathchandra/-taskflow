import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../validators/task.validators.js';

function buildOrderBy({ sortBy, order }: ListTasksQuery): Prisma.TaskOrderByWithRelationInput[] {
  // Tasks without a due date always sort after tasks that have one.
  const primary: Prisma.TaskOrderByWithRelationInput =
    sortBy === 'dueDate' ? { dueDate: { sort: order, nulls: 'last' } } : { [sortBy]: order };

  // Tie-breakers keep pagination stable when the primary values are equal.
  return [primary, { createdAt: 'desc' }, { id: 'asc' }];
}

export async function listTasks(query: ListTasksQuery) {
  const where: Prisma.TaskWhereInput = {
    ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: buildOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

export function createTask(input: CreateTaskInput) {
  return prisma.task.create({ data: input });
}

// A missing task makes Prisma throw P2025, which the error handler maps to 404.
export function updateTask(id: string, input: UpdateTaskInput) {
  return prisma.task.update({ where: { id }, data: input });
}

export function updateTaskStatus(id: string, status: TaskStatus) {
  return prisma.task.update({ where: { id }, data: { status } });
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}
