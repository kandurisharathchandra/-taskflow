import { CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { DueDateLabel, PriorityBadge, StatusBadge } from '../components/tasks/TaskBadges';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/FormControls';
import { LoadingState } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { ApiError, getErrorMessage } from '../services/api';
import { deleteTask, getTask, updateTaskStatus } from '../services/taskService';
import { TASK_STATUSES, type TaskStatus } from '../types/task';
import { formatTimestamp } from '../utils/date';
import { STATUS_LABELS } from '../utils/taskLabels';
import { TaskNotFound } from './TaskNotFound';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-32 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function TaskDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: task, error, loading, reload, setData } = useApi(useCallback(() => getTask(id), [id]));
  useDocumentTitle(task?.title ?? 'Task');

  const [statusSaving, setStatusSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return <TaskNotFound />;
  if (!task) {
    return (
      <Card className="mx-auto max-w-3xl">
        {loading ? <LoadingState label="Loading task…" /> : <ErrorState message={error?.message ?? ''} onRetry={reload} />}
      </Card>
    );
  }

  const completed = task.status === 'COMPLETED';

  const changeStatus = async (status: TaskStatus) => {
    if (statusSaving || status === task.status) return;
    setStatusSaving(true);
    try {
      const updated = await updateTaskStatus(task.id, status);
      setData(() => updated);
      showToast(`Status changed to ${STATUS_LABELS[status].toLowerCase()}`);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setStatusSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      showToast('Task deleted');
      navigate('/tasks', { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={task.title}
        back={{ to: '/tasks', label: 'All tasks' }}
        actions={
          <>
            <ButtonLink to={`/tasks/${task.id}/edit`} variant="secondary" icon={<Pencil className="size-4" aria-hidden />}>
              Edit
            </ButtonLink>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)} icon={<Trash2 className="size-4 text-red-600" aria-hidden />}>
              Delete
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-4">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="ml-auto">
            <Button
              variant={completed ? 'secondary' : 'primary'}
              size="sm"
              loading={statusSaving}
              onClick={() => changeStatus(completed ? 'PENDING' : 'COMPLETED')}
              icon={completed ? <RotateCcw className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
            >
              {completed ? 'Reopen task' : 'Mark as completed'}
            </Button>
          </span>
        </div>

        <div className="px-5 py-5">
          <h2 className="text-sm font-medium text-slate-700">Description</h2>
          {task.description ? (
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{task.description}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400 italic">No description</p>
          )}
        </div>

        <dl className="divide-y divide-slate-100 border-t border-slate-200 px-5">
          <Detail label="Status">
            <Select
              aria-label="Change status"
              value={task.status}
              onChange={(event) => changeStatus(event.target.value as TaskStatus)}
              disabled={statusSaving}
              className="h-9 w-44"
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Detail>
          <Detail label="Due date">
            <DueDateLabel dueDate={task.dueDate} completed={completed} />
          </Detail>
          <Detail label="Created">{formatTimestamp(task.createdAt)}</Detail>
          <Detail label="Last updated">{formatTimestamp(task.updatedAt)}</Detail>
        </dl>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this task?"
        description={`“${task.title}” will be permanently deleted. This can’t be undone.`}
        confirmLabel="Delete task"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
