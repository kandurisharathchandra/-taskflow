import { FileQuestion } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';

export function TaskNotFound() {
  return (
    <Card className="mx-auto max-w-3xl">
      <EmptyState
        icon={<FileQuestion className="size-6" aria-hidden />}
        title="Task not found"
        description="It may have been deleted, or the link is incorrect."
        action={
          <ButtonLink to="/tasks" variant="secondary">
            Back to all tasks
          </ButtonLink>
        }
      />
    </Card>
  );
}
