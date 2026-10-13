import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types/task';
import { toDateInputValue } from './date';

// Keep in sync with Backend/src/validators/task.validators.ts.
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 2000;

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** YYYY-MM-DD, or '' for none. */
  dueDate: string;
}

export type TaskFormField = keyof TaskFormValues;
export type TaskFormErrors = Partial<Record<TaskFormField, string>>;

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: '',
};

export function isTaskFormField(field: string): field is TaskFormField {
  return field in EMPTY_TASK_FORM;
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: toDateInputValue(task.dueDate),
  };
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Title is required';
  else if (title.length > TITLE_MAX_LENGTH) errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`;
  if (values.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
  }
  return errors;
}

export function toTaskInput(values: TaskFormValues, includeStatus: boolean): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    dueDate: values.dueDate || null,
    ...(includeStatus ? { status: values.status } : {}),
  };
}
