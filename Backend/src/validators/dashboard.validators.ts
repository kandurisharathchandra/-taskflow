import { z } from 'zod';

export const dashboardStatsQuerySchema = z.object({
  // The client's local calendar date, so "overdue" matches what the user sees.
  // Defaults to the server's current UTC date.
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'today must be in YYYY-MM-DD format')
    .optional()
    .transform((value) => new Date(`${value ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`))
    .refine((date) => !Number.isNaN(date.getTime()), 'today is not a valid date'),
});
