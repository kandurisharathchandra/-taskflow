import { TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

const RECENT_TASKS_LIMIT = 5;

/**
 * @param today The caller's current calendar date at UTC midnight. Tasks due
 *   before it that are not completed count as overdue.
 */
export async function getDashboardStats(today: Date) {
  const [statusGroups, priorityGroups, overdue, recentTasks] = await prisma.$transaction([
    prisma.task.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { status: 'asc' } }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { status: { not: TaskStatus.COMPLETED } },
      _count: { _all: true },
      orderBy: { priority: 'asc' },
    }),
    prisma.task.count({ where: { dueDate: { lt: today }, status: { not: TaskStatus.COMPLETED } } }),
    prisma.task.findMany({ orderBy: { updatedAt: 'desc' }, take: RECENT_TASKS_LIMIT }),
  ]);

  const byStatus = Object.fromEntries(Object.values(TaskStatus).map((status) => [status, 0])) as Record<
    TaskStatus,
    number
  >;
  for (const group of statusGroups) {
    byStatus[group.status] = (group._count as { _all: number })._all;
  }

  const openByPriority = Object.fromEntries(Object.values(TaskPriority).map((priority) => [priority, 0])) as Record<
    TaskPriority,
    number
  >;
  for (const group of priorityGroups) {
    openByPriority[group.priority] = (group._count as { _all: number })._all;
  }

  const total = byStatus.PENDING + byStatus.IN_PROGRESS + byStatus.COMPLETED;

  return {
    total,
    pending: byStatus.PENDING,
    inProgress: byStatus.IN_PROGRESS,
    completed: byStatus.COMPLETED,
    overdue,
    completionRate: total === 0 ? 0 : Math.round((byStatus.COMPLETED / total) * 100),
    openByPriority,
    recentTasks,
  };
}
