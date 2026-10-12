import { describeError } from './describe-error';
import { ActionButton, StatePanel } from './StatePanel';

export function ErrorState({
  label,
  error,
  onRetry,
  retrying = false,
  className,
}: {
  label?: string;
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const copy = describeError(error);
  return (
    <StatePanel
      label={label}
      role="alert"
      tone="error"
      title={copy.title}
      message={copy.message}
      className={className}
      action={
        onRetry && copy.canRetry ? (
          <ActionButton onClick={onRetry} disabled={retrying}>
            {retrying ? 'Retrying…' : 'Try again'}
          </ActionButton>
        ) : undefined
      }
    />
  );
}
