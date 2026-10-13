import { AlertCircle } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { ApiError, getErrorMessage } from '../../services/api';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskInput, type TaskPriority, type TaskStatus } from '../../types/task';
import {
  DESCRIPTION_MAX_LENGTH,
  EMPTY_TASK_FORM,
  TITLE_MAX_LENGTH,
  isTaskFormField,
  toTaskInput,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
} from '../../utils/taskForm';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/taskLabels';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/FormControls';

interface TaskFormProps {
  initialValues?: TaskFormValues;
  /** Show the status field. New tasks always start as pending. */
  showStatus?: boolean;
  submitLabel: string;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ initialValues = EMPTY_TASK_FORM, showStatus = false, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // A ref, not just state, so two clicks in the same frame can't both submit.
  const submittingRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const update = <K extends TaskFormField>(field: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validationErrors = validateTaskForm(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.title) titleRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(toTaskInput(values, showStatus));
    } catch (error) {
      // Show server-side validation errors next to the matching fields.
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const serverErrors: TaskFormErrors = {};
        for (const { field, message } of error.fieldErrors) {
          if (isTaskFormField(field)) serverErrors[field] ??= message;
        }
        setErrors(serverErrors);
      }
      setFormError(getErrorMessage(error));
      submittingRef.current = false;
      setSubmitting(false);
    }
    // On success the parent navigates away, so the form stays disabled.
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && (
        <div role="alert" className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{formError}</p>
        </div>
      )}

      <Field label="Title" required error={errors.title}>
        {(control) => (
          <Input
            {...control}
            ref={titleRef}
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="e.g. Prepare quarterly report"
            maxLength={TITLE_MAX_LENGTH}
            autoFocus
            disabled={submitting}
          />
        )}
      </Field>

      <Field
        label="Description"
        error={errors.description}
        hint={`${values.description.length}/${DESCRIPTION_MAX_LENGTH} characters`}
      >
        {(control) => (
          <Textarea
            {...control}
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Add any details, links or notes (optional)"
            maxLength={DESCRIPTION_MAX_LENGTH}
            disabled={submitting}
          />
        )}
      </Field>

      <div className={showStatus ? 'grid gap-6 sm:grid-cols-3' : 'grid gap-6 sm:grid-cols-2'}>
        {showStatus && (
          <Field label="Status" error={errors.status}>
            {(control) => (
              <Select
                {...control}
                value={values.status}
                onChange={(event) => update('status', event.target.value as TaskStatus)}
                disabled={submitting}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <Field label="Priority" error={errors.priority}>
          {(control) => (
            <Select
              {...control}
              value={values.priority}
              onChange={(event) => update('priority', event.target.value as TaskPriority)}
              disabled={submitting}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Due date" error={errors.dueDate}>
          {(control) => (
            <Input
              {...control}
              type="date"
              value={values.dueDate}
              onChange={(event) => update('dueDate', event.target.value)}
              disabled={submitting}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
