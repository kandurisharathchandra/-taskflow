import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import type { TaskInput } from '../../types/task';
import { TaskForm } from './TaskForm';

function renderForm(onSubmit: (input: TaskInput) => Promise<void>, showStatus = false) {
  const user = userEvent.setup();
  render(<TaskForm submitLabel="Create task" onSubmit={onSubmit} onCancel={vi.fn()} showStatus={showStatus} />);
  return user;
}

describe('TaskForm', () => {
  it('requires a title', async () => {
    const onSubmit = vi.fn();
    const user = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/title/i), '   ');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values, with empty optional fields as null', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/title/i), '  Write report  ');
    await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Write report', description: null, priority: 'HIGH', dueDate: null });
  });

  it('includes the status only when the status field is shown', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = renderForm(onSubmit, true);

    await user.type(screen.getByLabelText(/title/i), 'Task');
    await user.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: 'IN_PROGRESS' }));
  });

  it('prevents duplicate submissions while the request is pending', async () => {
    let resolve: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const user = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/title/i), 'Task');
    const submit = screen.getByRole('button', { name: 'Create task' });
    await user.click(submit);
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    resolve();
  });

  it('shows server validation errors and re-enables the form', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError('Title must be at most 200 characters', 400, 'VALIDATION_ERROR', [
          { field: 'title', message: 'Title must be at most 200 characters' },
        ]),
      );
    const user = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/title/i), 'Task');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title must be at most 200 characters');
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled();
  });
});
