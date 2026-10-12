import type { ReactNode } from 'react';

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-medium tracking-[0.08em] text-dim uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-md border border-line bg-bg p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-sm px-2.5 py-1 font-mono text-[12px] transition-colors ${
              active ? 'bg-raised text-fg shadow-[inset_0_0_0_1px_var(--color-line-strong)]' : 'text-dim hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange(next: boolean): void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-hover"
    >
      <span>
        <span className="block text-[13px] text-fg">{label}</span>
        {hint ? <span className="block text-[11px] text-faint">{hint}</span> : null}
      </span>
      <span
        aria-hidden
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-bg transition-transform ${checked ? 'translate-x-[14px]' : ''}`}
        />
      </span>
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  className = '',
  ...rest
}: {
  children: ReactNode;
  onClick?(): void;
  variant?: 'default' | 'primary';
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 ${
        variant === 'primary'
          ? 'border-accent bg-accent text-accent-ink hover:brightness-110'
          : 'border-line-strong bg-raised text-fg hover:bg-hover'
      } ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS_STYLE: Record<string, string> = {
  live: 'bg-live/15 text-live',
  final: 'bg-line text-dim',
  scheduled: 'bg-accent/10 text-accent',
  delayed: 'bg-warn/15 text-warn',
  postponed: 'bg-warn/15 text-warn',
  canceled: 'bg-warn/15 text-warn',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase ${STATUS_STYLE[status] ?? 'bg-line text-dim'}`}>
      {status}
    </span>
  );
}
