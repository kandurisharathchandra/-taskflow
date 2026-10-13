import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const controlBase =
  'block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

function controlClasses(invalid: boolean, className?: string) {
  return cn(
    controlBase,
    invalid
      ? 'border-red-400 focus:border-red-500 focus:outline-red-500/30'
      : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:outline-indigo-500/30',
    className,
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  /** Receives the generated id and aria attributes to put on the control. */
  children: (control: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
}

/** A label, a control, and an optional hint or error message, wired together for screen readers. */
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {message}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={controlClasses(!!props['aria-invalid'], cn('h-10', className))} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={controlClasses(!!props['aria-invalid'], cn('min-h-28 py-2', className))} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={controlClasses(!!props['aria-invalid'], cn('h-10 pr-8', className))} {...props}>
      {children}
    </select>
  );
}
