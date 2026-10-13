import { AlertCircle, CheckCircle2, CircleDot, ClipboardList, Clock, ListTodo, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskListItem } from '../components/tasks/TaskListItem';
import { ButtonLink } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { LoadingState } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getDashboardStats } from '../services/taskService';
import { TASK_PRIORITIES, type DashboardStats } from '../types/task';
import { cn } from '../utils/cn';
import { PRIORITY_LABELS } from '../utils/taskLabels';

const newTaskButton = (
  <ButtonLink to="/tasks/new" icon={<Plus className="size-4" aria-hidden />}>
    New task
  </ButtonLink>
);

function StatCard({ label, value, icon, iconClass, to }: { label: string; value: number; icon: ReactNode; iconClass: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <Card className="flex items-center gap-4 p-5 transition-shadow group-hover:shadow-md">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', iconClass)}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
        </div>
      </Card>
    </Link>
  );
}

const PRIORITY_BAR_COLORS = { LOW: 'bg-slate-400', MEDIUM: 'bg-amber-500', HIGH: 'bg-red-500' } as const;

function DashboardContent({ stats }: { stats: DashboardStats }) {
  const openTotal = stats.pending + stats.inProgress;

  return (
    <div className="space-y-6">
      <section aria-label="Task counts" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats.total}
          to="/tasks"
          icon={<ListTodo className="size-5" aria-hidden />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          to="/tasks?status=PENDING"
          icon={<Clock className="size-5" aria-hidden />}
          iconClass="bg-slate-100 text-slate-600"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          to="/tasks?status=IN_PROGRESS"
          icon={<CircleDot className="size-5" aria-hidden />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          to="/tasks?status=COMPLETED"
          icon={<CheckCircle2 className="size-5" aria-hidden />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900">Completion</h2>
          <p className="mt-4 text-4xl font-semibold text-slate-900 tabular-nums">{stats.completionRate}%</p>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Tasks completed"
            aria-valuenow={stats.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${stats.completionRate}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {stats.completed} of {stats.total} tasks completed
          </p>

          {stats.overdue > 0 && (
            <Link
              to="/tasks?sortBy=dueDate&order=asc"
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-500"
            >
              <AlertCircle className="size-4" aria-hidden />
              {stats.overdue} overdue {stats.overdue === 1 ? 'task' : 'tasks'}
            </Link>
          )}

          <h3 className="mt-6 text-sm font-medium text-slate-700">Open tasks by priority</h3>
          <ul className="mt-3 space-y-3">
            {[...TASK_PRIORITIES].reverse().map((priority) => {
              const count = stats.openByPriority[priority];
              const percent = openTotal === 0 ? 0 : Math.round((count / openTotal) * 100);
              return (
                <li key={priority}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{PRIORITY_LABELS[priority]}</span>
                    <span className="font-medium text-slate-900 tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <div className={cn('h-full rounded-full', PRIORITY_BAR_COLORS[priority])} style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recently updated"
            action={
              <Link
                to="/tasks?sortBy=updatedAt&order=desc"
                className="rounded text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {stats.recentTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { data: stats, error, loading, reload } = useApi(getDashboardStats);

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your tasks and progress." actions={newTaskButton} />

      {!stats && loading && <LoadingState label="Loading dashboard…" />}
      {!stats && error && (
        <Card>
          <ErrorState message={error.message} onRetry={reload} />
        </Card>
      )}
      {stats && stats.total === 0 && (
        <Card>
          <EmptyState
            icon={<ClipboardList className="size-6" aria-hidden />}
            title="No tasks yet"
            description="Create your first task to start tracking your work."
            action={newTaskButton}
          />
        </Card>
      )}
      {stats && stats.total > 0 && <DashboardContent stats={stats} />}
    </>
  );
}
