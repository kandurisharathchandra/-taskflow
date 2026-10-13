// Due dates are calendar dates sent by the API as UTC midnight timestamps
// ("2030-01-15T00:00:00.000Z"). They're handled as plain "YYYY-MM-DD" strings so the
// user's timezone never shifts them to the previous or next day.

/** The user's local calendar date as YYYY-MM-DD. */
export function todayISODate(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2030-01-15T00:00:00.000Z" → "2030-01-15". */
export function toDateInputValue(dueDate: string | null): string {
  return dueDate ? dueDate.slice(0, 10) : '';
}

export function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: string | null, isCompleted: boolean, now = new Date()): boolean {
  if (!dueDate || isCompleted) return false;
  return dueDate.slice(0, 10) < todayISODate(now);
}

export function isDueToday(dueDate: string | null, now = new Date()): boolean {
  return !!dueDate && dueDate.slice(0, 10) === todayISODate(now);
}
