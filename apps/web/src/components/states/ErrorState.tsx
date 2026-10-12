import { describeError } from './describe-error';
import { ActionButton, StatePanel } from './StatePanel';

export function ErrorState({
  error,
  onRetry,
  retrying = false,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const copy = describeError(error);
  return (
    <StatePanel
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
