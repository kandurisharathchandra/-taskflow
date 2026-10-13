import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { useCleanDatabase, utcDate } from './helpers.js';

useCleanDatabase();

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

async function createTask(body: Record<string, unknown>) {
  const res = await request(app).post('/api/tasks').send(body);
  expect(res.status).toBe(201);
  return res.body.data;
}

describe('GET /api/health', () => {
  it('reports the server is up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with defaults', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '  Write tests  ' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      title: 'Write tests',
      description: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: null,
    });
    expect(res.body.data.id).toEqual(expect.any(String));
    expect(await prisma.task.count()).toBe(1);
  });

  it('stores all provided fields', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Ship release',
      description: 'Tag and publish',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2030-01-15',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      description: 'Tag and publish',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2030-01-15T00:00:00.000Z',
    });
  });

  it.each([
    [{}, 'Title is required'],
    [{ title: '   ' }, 'Title is required'],
    [{ title: 'x'.repeat(201) }, 'Title must be at most 200 characters'],
    [{ title: 'Task', status: 'DONE' }, 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED'],
    [{ title: 'Task', priority: 'URGENT' }, 'Priority must be one of: LOW, MEDIUM, HIGH'],
    [{ title: 'Task', dueDate: '15/01/2030' }, 'Due date must be in YYYY-MM-DD format'],
    [{ title: 'Task', dueDate: '2030-02-30' }, 'Due date is not a valid calendar date'],
  ])('rejects invalid body %j', async (body, message) => {
    const res = await request(app).post('/api/tasks').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR', message } });
    expect(await prisma.task.count()).toBe(0);
  });

  it('rejects unknown fields', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task', owner: 'me' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/tasks').set('Content-Type', 'application/json').send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns one task', async () => {
    const task = await createTask({ title: 'Read me' });
    const res = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: task.id, title: 'Read me' });
  });

  it('returns 404 for a missing task', async () => {
    const res = await request(app).get(`/api/tasks/${MISSING_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/tasks/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task id must be a valid UUID');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates the given fields and leaves the rest', async () => {
    const task = await createTask({ title: 'Old', description: 'Keep me', priority: 'LOW' });

    const res = await request(app).put(`/api/tasks/${task.id}`).send({ title: 'New', dueDate: '2031-05-01' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'New',
      description: 'Keep me',
      priority: 'LOW',
      dueDate: '2031-05-01T00:00:00.000Z',
    });
  });

  it('clears optional fields with null or an empty string', async () => {
    const task = await createTask({ title: 'Task', description: 'Remove me', dueDate: '2031-05-01' });

    const res = await request(app).put(`/api/tasks/${task.id}`).send({ description: '', dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ description: null, dueDate: null });
  });

  it('rejects an empty update', async () => {
    const task = await createTask({ title: 'Task' });
    const res = await request(app).put(`/api/tasks/${task.id}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Provide at least one field to update');
  });

  it('returns 404 for a missing task', async () => {
    const res = await request(app).put(`/api/tasks/${MISSING_ID}`).send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('changes only the status', async () => {
    const task = await createTask({ title: 'Task' });
    const res = await request(app).patch(`/api/tasks/${task.id}/status`).send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Task', status: 'COMPLETED' });
  });

  it('rejects an invalid status', async () => {
    const task = await createTask({ title: 'Task' });
    const res = await request(app).patch(`/api/tasks/${task.id}/status`).send({ status: 'ARCHIVED' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing task', async () => {
    const res = await request(app).patch(`/api/tasks/${MISSING_ID}/status`).send({ status: 'COMPLETED' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task', async () => {
    const task = await createTask({ title: 'Task' });
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.task.count()).toBe(0);
  });

  it('returns 404 for a missing task', async () => {
    const res = await request(app).delete(`/api/tasks/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks', () => {
  async function seed() {
    // createdAt is set explicitly so the default sort order is deterministic.
    await prisma.task.createMany({
      data: [
        { title: 'Alpha report', status: 'PENDING', priority: 'HIGH', dueDate: utcDate(3), createdAt: new Date('2030-01-01') },
        { title: 'Beta launch', status: 'COMPLETED', priority: 'LOW', dueDate: utcDate(1), createdAt: new Date('2030-01-02') },
        { title: 'Gamma REPORT', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: null, createdAt: new Date('2030-01-03') },
        { title: 'Delta review', status: 'PENDING', priority: 'MEDIUM', dueDate: utcDate(2), createdAt: new Date('2030-01-04') },
      ],
    });
  }

  const titles = (res: request.Response) => res.body.data.map((task: { title: string }) => task.title);

  it('lists newest first with pagination metadata', async () => {
    await seed();
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['Delta review', 'Gamma REPORT', 'Beta launch', 'Alpha report']);
    expect(res.body.meta.pagination).toEqual({ page: 1, limit: 10, total: 4, totalPages: 1 });
  });

  it('searches titles case-insensitively', async () => {
    await seed();
    const res = await request(app).get('/api/tasks').query({ search: 'report' });
    expect(titles(res)).toEqual(['Gamma REPORT', 'Alpha report']);
  });

  it('filters by status and priority together', async () => {
    await seed();
    const res = await request(app).get('/api/tasks').query({ status: 'PENDING', priority: 'HIGH' });
    expect(titles(res)).toEqual(['Alpha report']);
  });

  it('sorts by due date with undated tasks last', async () => {
    await seed();
    const res = await request(app).get('/api/tasks').query({ sortBy: 'dueDate', order: 'asc' });
    expect(titles(res)).toEqual(['Beta launch', 'Delta review', 'Alpha report', 'Gamma REPORT']);
  });

  it('paginates', async () => {
    await seed();
    const res = await request(app).get('/api/tasks').query({ page: 2, limit: 3 });
    expect(titles(res)).toEqual(['Alpha report']);
    expect(res.body.meta.pagination).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it('returns an empty list when nothing matches', async () => {
    await seed();
    const res = await request(app).get('/api/tasks').query({ search: 'nothing like this' });
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.pagination.total).toBe(0);
  });

  it.each([{ status: 'DONE' }, { sortBy: 'owner' }, { page: 0 }, { limit: 500 }])(
    'rejects invalid query %j',
    async (query) => {
      const res = await request(app).get('/api/tasks').query(query);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    },
  );
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'ROUTE_NOT_FOUND' } });
  });
});
