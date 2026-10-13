import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { useCleanDatabase, utcDate } from './helpers.js';

useCleanDatabase();

describe('GET /api/dashboard/stats', () => {
  it('returns zeros for an empty database', async () => {
    const res = await request(app).get('/api/dashboard/stats');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
      openByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      recentTasks: [],
    });
  });

  it('computes counts from the database', async () => {
    await prisma.task.createMany({
      data: [
        { title: 'Overdue pending', status: 'PENDING', priority: 'HIGH', dueDate: utcDate(-2) },
        { title: 'Overdue but done', status: 'COMPLETED', priority: 'HIGH', dueDate: utcDate(-2) },
        { title: 'Due today', status: 'IN_PROGRESS', priority: 'LOW', dueDate: utcDate(0) },
        { title: 'No due date', status: 'COMPLETED', priority: 'MEDIUM' },
      ],
    });

    const res = await request(app).get('/api/dashboard/stats');

    expect(res.body.data).toMatchObject({
      total: 4,
      pending: 1,
      inProgress: 1,
      completed: 2,
      overdue: 1,
      completionRate: 50,
      openByPriority: { LOW: 1, MEDIUM: 0, HIGH: 1 },
    });
    expect(res.body.data.recentTasks).toHaveLength(4);
  });

  it('limits recent tasks to the five most recently updated', async () => {
    for (let i = 1; i <= 7; i++) {
      await prisma.task.create({ data: { title: `Task ${i}`, updatedAt: new Date(2030, 0, i) } });
    }

    const res = await request(app).get('/api/dashboard/stats');

    expect(res.body.data.recentTasks.map((task: { title: string }) => task.title)).toEqual([
      'Task 7',
      'Task 6',
      'Task 5',
      'Task 4',
      'Task 3',
    ]);
  });

  it("uses the client's date for overdue when given", async () => {
    await prisma.task.create({ data: { title: 'Due 2030-06-10', dueDate: new Date('2030-06-10T00:00:00Z') } });

    const before = await request(app).get('/api/dashboard/stats').query({ today: '2030-06-10' });
    const after = await request(app).get('/api/dashboard/stats').query({ today: '2030-06-11' });

    expect(before.body.data.overdue).toBe(0);
    expect(after.body.data.overdue).toBe(1);
  });

  it('rejects a malformed date', async () => {
    const res = await request(app).get('/api/dashboard/stats').query({ today: 'tomorrow' });
    expect(res.status).toBe(400);
  });
});
