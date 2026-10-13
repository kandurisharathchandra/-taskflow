import { Compass } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <EmptyState
        icon={<Compass className="size-6" aria-hidden />}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        action={<ButtonLink to="/">Go to dashboard</ButtonLink>}
      />
    </Card>
  );
}
