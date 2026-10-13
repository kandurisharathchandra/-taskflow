import type { SortField, SortOrder, TaskPriority, TaskStatus } from '../types/task';

export interface TaskFilterValues {
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  sortBy: SortField;
  order: SortOrder;
}

export const DEFAULT_FILTERS: TaskFilterValues = {
  search: '',
  status: '',
  priority: '',
  sortBy: 'createdAt',
  order: 'desc',
};

export const SORT_OPTIONS: Array<{ value: `${SortField}:${SortOrder}`; label: string }> = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'dueDate:asc', label: 'Due date (soonest)' },
  { value: 'dueDate:desc', label: 'Due date (latest)' },
  { value: 'priority:desc', label: 'Priority (high to low)' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'title:asc', label: 'Title (A–Z)' },
];
