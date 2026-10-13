import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 2000;

const statusSchema = z.nativeEnum(TaskStatus, {
  errorMap: () => ({ message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}` }),
});

const prioritySchema = z.nativeEnum(TaskPriority, {
  errorMap: () => ({ message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}` }),
});

const titleSchema = z
  .string({ required_error: 'Title is required', invalid_type_error: 'Title must be a string' })
  .trim()
  .min(1, 'Title is required')
  .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`);

// Empty or whitespace-only descriptions are stored as null.
const descriptionSchema = z
  .string({ invalid_type_error: 'Description must be a string' })
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
  .transform((value) => (value === '' ? null : value))
  .nullable();

// Due dates are calendar dates ("YYYY-MM-DD"). Stored as a Postgres DATE at UTC midnight.
const dueDateSchema = z
  .string({ invalid_type_error: 'Due date must be a string in YYYY-MM-DD format' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Due date is not a valid calendar date')
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .nullable();

export const taskIdParamsSchema = z.object({
  id: z.string().uuid('Task id must be a valid UUID'),
});

export const createTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    dueDate: dueDateSchema.optional(),
  })
  .strict();

export const updateTaskSchema = createTaskSchema
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

export const updateTaskStatusSchema = z.object({ status: statusSchema }).strict();

export const SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'title', 'priority'] as const;

export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(TITLE_MAX_LENGTH).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  sortBy: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
