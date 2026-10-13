// Mirrors the backend Prisma model and API contract (see .claude/CLAUDE.md).

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO timestamp at UTC midnight of the due calendar date, or null. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** Calendar date in YYYY-MM-DD format, or null to clear it. */
  dueDate?: string | null;
}

export type SortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'title' | 'priority';
export type SortOrder = 'asc' | 'desc';

export interface TaskListQuery {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: SortField;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskListResult {
  tasks: Task[];
  pagination: Pagination;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
  openByPriority: Record<TaskPriority, number>;
  recentTasks: Task[];
}
