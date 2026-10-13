import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/api';
import * as taskService from '../services/taskService';
import type { DashboardStats, Task } from '../types/task';
import { makeTask, renderApp } from '../test/utils';

vi.mock('../services/taskService');
const service = vi.mocked(taskService);

function listResult(tasks: Task[], page = 1, total = tasks.length) {
  return { tasks, pagination: { page, limit: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } };
}

const emptyStats: DashboardStats = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  overdue: 0,
  completionRate: 0,
  openByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
  recentTasks: [],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Dashboard', () => {
  it('shows statistics and recent tasks', async () => {
    service.getDashboardStats.mockResolvedValue({
      ...emptyStats,
      total: 4,
      pending: 1,
      inProgress: 1,
      completed: 2,
      overdue: 1,
      completionRate: 50,
      openByPriority: { LOW: 0, MEDIUM: 1, HIGH: 1 },
      recentTasks: [makeTask({ title: 'Recent work' })],
    });
    renderApp('/');

    const counts = await screen.findByRole('region', { name: 'Task counts' });
    expect(within(counts).getByText('Total tasks').nextSibling).toHaveTextContent('4');
    expect(within(counts).getByText('Completed').nextSibling).toHaveTextContent('2');
    expect(screen.getByRole('progressbar', { name: 'Tasks completed' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('1 overdue task')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recent work' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no tasks', async () => {
    service.getDashboardStats.mockResolvedValue(emptyStats);
    renderApp('/');
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  });

  it('shows an error with a retry button', async () => {
    service.getDashboardStats
      .mockRejectedValueOnce(new ApiError('Cannot reach the server.', null, 'NETWORK_ERROR'))
      .mockResolvedValueOnce(emptyStats);
    const { user } = renderApp('/');

    expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  });
});

describe('All tasks', () => {
  it('lists tasks', async () => {
    service.listTasks.mockResolvedValue(listResult([makeTask({ title: 'First' }), makeTask({ title: 'Second' })]));
    renderApp('/tasks');

    expect(await screen.findByRole('link', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Second' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('Showing 1–2 of 2');
  });

  it('reads filters from the URL', async () => {
    service.listTasks.mockResolvedValue(listResult([]));
    renderApp('/tasks?status=COMPLETED&priority=HIGH&sortBy=dueDate&order=asc&page=2');

    await waitFor(() =>
      expect(service.listTasks).toHaveBeenCalledWith({
        search: undefined,
        status: 'COMPLETED',
        priority: 'HIGH',
        sortBy: 'dueDate',
        order: 'asc',
        page: 2,
        limit: 10,
      }),
    );
    expect(screen.getByLabelText('Filter by status')).toHaveValue('COMPLETED');
  });

  it('refetches when a filter changes and offers to clear filters when nothing matches', async () => {
    service.listTasks.mockResolvedValueOnce(listResult([makeTask({ title: 'Only task' })]));
    service.listTasks.mockResolvedValue(listResult([]));
    const { user } = renderApp('/tasks');
    await screen.findByRole('link', { name: 'Only task' });

    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'LOW');

    await waitFor(() => expect(service.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ priority: 'LOW', page: 1 })));
    expect(await screen.findByText('No tasks match your filters')).toBeInTheDocument();
  });

  it('debounces the search box', async () => {
    service.listTasks.mockResolvedValue(listResult([]));
    const { user } = renderApp('/tasks');
    await screen.findByText('No tasks yet');

    await user.type(screen.getByLabelText('Search tasks by title'), 'report');

    await waitFor(() => expect(service.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'report' })));
    // One initial load plus one search, not one request per keystroke.
    expect(service.listTasks).toHaveBeenCalledTimes(2);
  });

  it('marks a task as completed from the list', async () => {
    const task = makeTask({ title: 'Finish me' });
    service.listTasks.mockResolvedValue(listResult([task]));
    service.updateTaskStatus.mockResolvedValue({ ...task, status: 'COMPLETED' });
    const { user } = renderApp('/tasks');

    await user.click(await screen.findByRole('button', { name: 'Mark “Finish me” as completed' }));

    expect(service.updateTaskStatus).toHaveBeenCalledWith(task.id, 'COMPLETED');
    expect(await screen.findByRole('button', { name: 'Mark “Finish me” as pending' })).toBeInTheDocument();
    expect(await screen.findByText('Task marked as completed')).toBeInTheDocument();
  });
});

describe('Create task', () => {
  it('creates a task and opens it', async () => {
    const created = makeTask({ title: 'Brand new' });
    service.createTask.mockResolvedValue(created);
    service.getTask.mockResolvedValue(created);
    const { user } = renderApp('/tasks/new');

    await user.type(screen.getByLabelText(/title/i), 'Brand new');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(service.createTask).toHaveBeenCalledWith({ title: 'Brand new', description: null, priority: 'MEDIUM', dueDate: null });
    expect(await screen.findByRole('heading', { level: 1, name: 'Brand new' })).toBeInTheDocument();
    expect(screen.getByText('Task created')).toBeInTheDocument();
  });
});

describe('Edit task', () => {
  it('pre-fills the form and saves changes', async () => {
    const task = makeTask({ title: 'Old title', description: 'Details', priority: 'LOW', dueDate: '2030-03-04T00:00:00.000Z' });
    service.getTask.mockResolvedValue(task);
    service.updateTask.mockResolvedValue({ ...task, title: 'New title' });
    const { user } = renderApp(`/tasks/${task.id}/edit`);

    const title = await screen.findByLabelText(/title/i);
    expect(title).toHaveValue('Old title');
    expect(screen.getByLabelText('Due date')).toHaveValue('2030-03-04');

    await user.clear(title);
    await user.type(title, 'New title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(service.updateTask).toHaveBeenCalledWith(task.id, {
      title: 'New title',
      description: 'Details',
      priority: 'LOW',
      status: 'PENDING',
      dueDate: '2030-03-04',
    });
  });
});

describe('Task details', () => {
  it('shows the task and changes its status', async () => {
    const task = makeTask({ title: 'Read me', description: 'Line one' });
    service.getTask.mockResolvedValue(task);
    service.updateTaskStatus.mockResolvedValue({ ...task, status: 'COMPLETED' });
    const { user } = renderApp(`/tasks/${task.id}`);

    expect(await screen.findByRole('heading', { level: 1, name: 'Read me' })).toBeInTheDocument();
    expect(screen.getByText('Line one')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as completed' }));

    expect(service.updateTaskStatus).toHaveBeenCalledWith(task.id, 'COMPLETED');
    expect(await screen.findByRole('button', { name: 'Reopen task' })).toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    const task = makeTask({ title: 'Delete me' });
    service.getTask.mockResolvedValue(task);
    service.deleteTask.mockResolvedValue();
    service.listTasks.mockResolvedValue(listResult([]));
    const { user } = renderApp(`/tasks/${task.id}`);

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this task?' });

    // Cancelling keeps the task.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(service.deleteTask).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete task' }));

    expect(service.deleteTask).toHaveBeenCalledWith(task.id);
    expect(await screen.findByRole('heading', { level: 1, name: 'All tasks' })).toBeInTheDocument();
    expect(screen.getByText('Task deleted')).toBeInTheDocument();
  });

  it('closes the delete dialog with Escape', async () => {
    service.getTask.mockResolvedValue(makeTask());
    const { user } = renderApp('/tasks/some-id');

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows a not-found state for a missing task', async () => {
    service.getTask.mockRejectedValue(new ApiError('Task not found', 404, 'NOT_FOUND'));
    renderApp('/tasks/00000000-0000-4000-8000-000000000000');
    expect(await screen.findByText('Task not found')).toBeInTheDocument();
  });
});

describe('Unknown routes', () => {
  it('shows the not-found page', async () => {
    renderApp('/does/not/exist');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');
  });
});
