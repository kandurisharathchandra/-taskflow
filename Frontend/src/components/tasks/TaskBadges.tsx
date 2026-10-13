import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../../types/task';
import { cn } from '../../utils/cn';
import { formatDueDate, isDueToday, isOverdue } from '../../utils/date';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/taskLabels';
import { Badge, type BadgeTone } from '../ui/Badge';

const STATUS_STYLES: Record<TaskStatus, { tone: BadgeTone; Icon: typeof Circle }> = {
  PENDING: { tone: 'gray', Icon: Circle },
  IN_PROGRESS: { tone: 'blue', Icon: CircleDot },
  COMPLETED: { tone: 'green', Icon: CheckCircle2 },
};

const PRIORITY_STYLES: Record<TaskPriority, { tone: BadgeTone; Icon: typeof Circle }> = {
  LOW: { tone: 'gray', Icon: ArrowDown },
  MEDIUM: { tone: 'amber', Icon: ArrowRight },
  HIGH: { tone: 'red', Icon: ArrowUp },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { tone, Icon } = STATUS_STYLES[status];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { tone, Icon } = PRIORITY_STYLES[priority];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden />
      {PRIORITY_LABELS[priority]}
      <span className="sr-only"> priority</span>
    </Badge>
  );
}

export function DueDateLabel({ dueDate, completed }: { dueDate: string | null; completed: boolean }) {
  if (!dueDate) return <span className="text-xs text-slate-400">No due date</span>;

  const overdue = isOverdue(dueDate, completed);
  const today = !completed && isDueToday(dueDate);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs whitespace-nowrap',
        overdue ? 'font-medium text-red-600' : today ? 'font-medium text-amber-700' : 'text-slate-500',
      )}
    >
      <CalendarDays className="size-3.5" aria-hidden />
      {overdue ? 'Overdue · ' : today ? 'Due today · ' : 'Due '}
      {formatDueDate(dueDate)}
    </span>
  );
}
