import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../App';
import type { Task } from '../types/task';

/** Renders the whole app (layout, routes, toasts) at the given URL. */
export function renderApp(path = '/') {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return { user, ...result };
}

let nextId = 1;

export function makeTask(overrides: Partial<Task> = {}): Task {
  const id = `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;
  return {
    id,
    title: 'Sample task',
    description: null,
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: '2030-01-01T10:00:00.000Z',
    updatedAt: '2030-01-01T10:00:00.000Z',
    ...overrides,
  };
}
