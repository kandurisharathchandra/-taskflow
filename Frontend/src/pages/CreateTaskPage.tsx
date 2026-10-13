import { useNavigate } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card } from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { createTask } from '../services/taskService';
import type { TaskInput } from '../types/task';

export function CreateTaskPage() {
  useDocumentTitle('New task');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (input: TaskInput) => {
    const task = await createTask(input);
    showToast('Task created');
    navigate(`/tasks/${task.id}`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New task" description="Add a task to your list." back={{ to: '/tasks', label: 'All tasks' }} />
      <Card className="p-5 sm:p-6">
        <TaskForm submitLabel="Create task" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
      </Card>
    </div>
  );
}
