import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router';
import type { Task } from '../../types/task';
import { cn } from '../../utils/cn';
import { Spinner } from '../ui/Spinner';
import { DueDateLabel, PriorityBadge, StatusBadge } from './TaskBadges';

interface TaskListItemProps {
  task: Task;
  /** When provided, shows a button that toggles the task between completed and pending. */
  onToggleComplete?: (task: Task) => void;
  toggling?: boolean;
}

export function TaskListItem({ task, onToggleComplete, toggling = false }: TaskListItemProps) {
  const completed = task.status === 'COMPLETED';

  return (
    <li className="group relative flex items-start gap-3 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5">
      {onToggleComplete && (
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          disabled={toggling}
          className="relative z-10 -m-1 mt-0 rounded-full p-1 text-slate-400 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-wait"
          aria-label={completed ? `Mark “${task.title}” as pending` : `Mark “${task.title}” as completed`}
        >
          {toggling ? (
            <Spinner className="size-5" />
          ) : completed ? (
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
          ) : (
            <Circle className="size-5" aria-hidden />
          )}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {/* The link's ::after covers the whole row so the row is clickable. */}
            <Link
              to={`/tasks/${task.id}`}
              className={cn(
                'block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-indigo-500',
                completed ? 'text-slate-500 line-through' : 'text-slate-900',
              )}
            >
              {task.title}
            </Link>
            {task.description && <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{task.description}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="mt-2">
          <DueDateLabel dueDate={task.dueDate} completed={completed} />
        </div>
      </div>
    </li>
  );
}
