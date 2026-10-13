import { describe, expect, it } from 'vitest';
import { formatDueDate, isDueToday, isOverdue, toDateInputValue, todayISODate } from './date';

// Local-time constructor: June 10th 2030, 11pm wherever the tests run.
const lateEvening = new Date(2030, 5, 10, 23, 0, 0);

describe('date utils', () => {
  it('uses the local calendar date for today', () => {
    expect(todayISODate(lateEvening)).toBe('2030-06-10');
  });

  it('converts API timestamps to date input values', () => {
    expect(toDateInputValue('2030-06-10T00:00:00.000Z')).toBe('2030-06-10');
    expect(toDateInputValue(null)).toBe('');
  });

  it('formats due dates without shifting them by timezone', () => {
    expect(formatDueDate('2030-01-01T00:00:00.000Z')).toContain('2030');
    expect(formatDueDate('2030-01-01T00:00:00.000Z')).not.toContain('2029');
  });

  it('marks past due dates as overdue unless completed', () => {
    expect(isOverdue('2030-06-09T00:00:00.000Z', false, lateEvening)).toBe(true);
    expect(isOverdue('2030-06-09T00:00:00.000Z', true, lateEvening)).toBe(false);
    expect(isOverdue('2030-06-10T00:00:00.000Z', false, lateEvening)).toBe(false);
    expect(isOverdue(null, false, lateEvening)).toBe(false);
  });

  it('detects tasks due today', () => {
    expect(isDueToday('2030-06-10T00:00:00.000Z', lateEvening)).toBe(true);
    expect(isDueToday('2030-06-11T00:00:00.000Z', lateEvening)).toBe(false);
  });
});
