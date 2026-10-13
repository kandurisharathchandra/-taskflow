import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/prisma.js';

export function useCleanDatabase() {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}

export function utcDate(daysFromToday: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date;
}
