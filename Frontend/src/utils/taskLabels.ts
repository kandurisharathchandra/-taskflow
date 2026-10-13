import type { SortField, TaskPriority, TaskStatus } from '../types/task';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const SORT_LABELS: Partial<Record<SortField, string>> = {
  createdAt: 'Date created',
  dueDate: 'Due date',
  updatedAt: 'Last updated',
  title: 'Title',
  priority: 'Priority',
};
