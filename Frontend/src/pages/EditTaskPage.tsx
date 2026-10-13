import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { ApiError } from '../services/api';
import { getTask, updateTask } from '../services/taskService';
import type { TaskInput } from '../types/task';
import { taskToFormValues } from '../utils/taskForm';
import { TaskNotFound } from './TaskNotFound';

export function EditTaskPage() {
  useDocumentTitle('Edit task');
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: task, error, loading, reload } = useApi(useCallback(() => getTask(id), [id]));

  const handleSubmit = async (input: TaskInput) => {
    await updateTask(id, input);
    showToast('Changes saved');
    navigate(`/tasks/${id}`, { replace: true });
  };

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return <TaskNotFound />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit task" back={{ to: `/tasks/${id}`, label: 'Back to task' }} />
      <Card className="p-5 sm:p-6">
        {loading && !task && <LoadingState label="Loading task…" />}
        {error && !task && <ErrorState message={error.message} onRetry={reload} />}
        {task && (
          <TaskForm
            // Remount if a different task is loaded so the form starts from its values.
            key={task.id}
            initialValues={taskToFormValues(task)}
            showStatus
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
          />
        )}
      </Card>
    </div>
  );
}
