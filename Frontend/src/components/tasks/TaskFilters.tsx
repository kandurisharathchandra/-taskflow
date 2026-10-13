import { Search, X } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES, type SortField, type SortOrder, type TaskPriority, type TaskStatus } from '../../types/task';
import { SORT_OPTIONS, type TaskFilterValues } from '../../utils/taskFilters';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/taskLabels';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormControls';

interface TaskFiltersProps {
  values: TaskFilterValues;
  onChange: (changes: Partial<TaskFilterValues>) => void;
  onReset: () => void;
}

export function TaskFilters({ values, onChange, onReset }: TaskFiltersProps) {
  const hasActiveFilters = values.search !== '' || values.status !== '' || values.priority !== '';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          type="search"
          value={values.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search tasks by title…"
          aria-label="Search tasks by title"
          className="pl-9"
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:w-auto">
        <Select
          aria-label="Filter by status"
          value={values.status}
          onChange={(event) => onChange({ status: event.target.value as TaskStatus | '' })}
          className="lg:w-40"
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by priority"
          value={values.priority}
          onChange={(event) => onChange({ priority: event.target.value as TaskPriority | '' })}
          className="lg:w-40"
        >
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Sort tasks"
          value={`${values.sortBy}:${values.order}`}
          onChange={(event) => {
            const [sortBy, order] = event.target.value.split(':') as [SortField, SortOrder];
            onChange({ sortBy, order });
          }}
          className="col-span-2 sm:col-span-1 lg:w-48"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="md" onClick={onReset} icon={<X className="size-4" aria-hidden />}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
