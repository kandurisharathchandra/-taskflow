import type { ApiSuccess } from '../types/api';
import type { DashboardStats, Pagination, Task, TaskInput, TaskListQuery, TaskListResult, TaskStatus } from '../types/task';
import { todayISODate } from '../utils/date';
import { api } from './api';

export async function listTasks(query: TaskListQuery = {}): Promise<TaskListResult> {
  const { data } = await api.get<ApiSuccess<Task[]>>('/tasks', { params: query });
  return { tasks: data.data, pagination: data.meta?.pagination as Pagination };
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await api.get<ApiSuccess<Task>>(`/tasks/${id}`);
  return data.data;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<ApiSuccess<Task>>('/tasks', input);
  return data.data;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.put<ApiSuccess<Task>>(`/tasks/${id}`, input);
  return data.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await api.patch<ApiSuccess<Task>>(`/tasks/${id}/status`, { status });
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Send the user's local date so "overdue" matches what they see on screen.
  const { data } = await api.get<ApiSuccess<DashboardStats>>('/dashboard/stats', {
    params: { today: todayISODate() },
  });
  return data.data;
}
