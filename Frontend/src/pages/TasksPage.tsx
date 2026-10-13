import { ClipboardList, Plus, SearchX } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination } from '../components/tasks/Pagination';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskListItem } from '../components/tasks/TaskListItem';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../services/api';
import { listTasks, updateTaskStatus } from '../services/taskService';
import { TASK_PRIORITIES, TASK_STATUSES, type SortField, type SortOrder, type Task } from '../types/task';
import { cn } from '../utils/cn';
import { DEFAULT_FILTERS, SORT_OPTIONS, type TaskFilterValues } from '../utils/taskFilters';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** Filters live in the URL so they survive reloads and can be linked to (e.g. from the dashboard). */
function readFilters(params: URLSearchParams): TaskFilterValues & { page: number } {
  const sort = `${params.get('sortBy')}:${params.get('order')}`;
  const validSort = SORT_OPTIONS.some((option) => option.value === sort);
  const [sortBy, order] = (validSort ? sort : `${DEFAULT_FILTERS.sortBy}:${DEFAULT_FILTERS.order}`).split(':') as [
    SortField,
    SortOrder,
  ];
  const page = Number(params.get('page'));

  return {
    search: params.get('search') ?? '',
    status: oneOf(params.get('status'), TASK_STATUSES) ?? '',
    priority: oneOf(params.get('priority'), TASK_PRIORITIES) ?? '',
    sortBy,
    order,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function TasksPage() {
  useDocumentTitle('All tasks');
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const { search, status, priority, sortBy, order, page } = filters;

  // The search box updates immediately; the URL (and the request) follow after a pause in typing.
  const [searchInput, setSearchInput] = useState(search);
  const [lastUrlSearch, setLastUrlSearch] = useState(search);
  if (search !== lastUrlSearch) {
    // The URL changed from outside the search box (back button, "Clear filters").
    setLastUrlSearch(search);
    setSearchInput(search);
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateParams = useCallback(
    (changes: Partial<TaskFilterValues> & { page?: number }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === undefined) next.delete(key);
            else next.set(key, String(value));
          }
          // Changing a filter or the sort order goes back to the first page.
          if (!('page' in changes)) next.delete('page');
          if (next.get('page') === '1') next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const handleFilterChange = (changes: Partial<TaskFilterValues>) => {
    if (changes.search !== undefined) {
      const value = changes.search;
      setSearchInput(value);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setLastUrlSearch(value.trim());
        updateParams({ search: value.trim() });
      }, SEARCH_DEBOUNCE_MS);
      return;
    }
    updateParams(changes);
  };

  const resetFilters = () => {
    clearTimeout(searchTimer.current);
    setSearchInput('');
    setLastUrlSearch('');
    setParams({}, { replace: true });
  };

  const fetchTasks = useCallback(
    () =>
      listTasks({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        sortBy,
        order,
        page,
        limit: PAGE_SIZE,
      }),
    [search, status, priority, sortBy, order, page],
  );
  const { data, error, loading, reload, setData } = useApi(fetchTasks);

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const toggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setTogglingIds((ids) => new Set(ids).add(task.id));
    try {
      const updated = await updateTaskStatus(task.id, nextStatus);
      // Update in place rather than refetching, so the row doesn't jump away mid-click.
      setData((prev) => prev && { ...prev, tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)) });
      showToast(nextStatus === 'COMPLETED' ? 'Task marked as completed' : 'Task moved back to pending');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setTogglingIds((ids) => {
        const next = new Set(ids);
        next.delete(task.id);
        return next;
      });
    }
  };

  const hasFilters = search !== '' || status !== '' || priority !== '';
  const newTaskButton = (
    <ButtonLink to="/tasks/new" icon={<Plus className="size-4" aria-hidden />}>
      New task
    </ButtonLink>
  );

  let content;
  if (!data && loading) {
    content = <LoadingState label="Loading tasks…" />;
  } else if (error && !data) {
    content = <ErrorState message={error.message} onRetry={reload} />;
  } else if (data && data.tasks.length === 0) {
    if (page > 1 && data.pagination.total > 0) {
      content = (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="This page is empty"
          description={`There are only ${data.pagination.totalPages} page(s) of results.`}
          action={
            <Button variant="secondary" onClick={() => updateParams({ page: 1 })}>
              Go to first page
            </Button>
          }
        />
      );
    } else if (hasFilters) {
      content = (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="No tasks match your filters"
          description="Try a different search term or clear the filters."
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      );
    } else {
      content = (
        <EmptyState
          icon={<ClipboardList className="size-6" aria-hidden />}
          title="No tasks yet"
          description="Create your first task to start tracking your work."
          action={newTaskButton}
        />
      );
    }
  } else if (data) {
    content = (
      <>
        {error && (
          <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
            Couldn’t refresh the list: {error.message}{' '}
            <button type="button" onClick={reload} className="font-medium underline">
              Try again
            </button>
          </p>
        )}
        <ul className={cn('divide-y divide-slate-100 transition-opacity', loading && 'opacity-60')}>
          {data.tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onToggleComplete={toggleComplete}
              toggling={togglingIds.has(task.id)}
            />
          ))}
        </ul>
        <Pagination pagination={data.pagination} onPageChange={(next) => updateParams({ page: next })} disabled={loading} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="All tasks" description="Search, filter and sort everything on your list." actions={newTaskButton} />

      <div className="mb-4">
        <TaskFilters values={{ ...filters, search: searchInput }} onChange={handleFilterChange} onReset={resetFilters} />
      </div>

      <Card aria-busy={loading} aria-live="polite">
        {content}
      </Card>
    </>
  );
}
