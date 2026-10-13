import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationData } from '../../types/task';
import { Button } from '../ui/Button';

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ pagination, onPageChange, disabled = false }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 sm:px-5"
    >
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{first}</span>–<span className="font-medium">{last}</span> of{' '}
        <span className="font-medium">{total}</span>
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            icon={<ChevronLeft className="size-4" aria-hidden />}
          >
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </nav>
  );
}
