import { cn } from '../lib/cn';
import { Chip, type ChipSize, type ChipTone } from './Chip';

export type GameStatusKind = 'scheduled' | 'live' | 'final' | 'halftime';

export interface StatusPillProps {
  status: GameStatusKind;
  /** Overrides the default text, e.g. "Q3 4:12" while live or "7:00 PM" before the game. */
  label?: string;
  size?: ChipSize;
  className?: string;
}

const defaults: Record<GameStatusKind, { label: string; tone: ChipTone }> = {
  scheduled: { label: 'Scheduled', tone: 'outline' },
  live: { label: 'Live', tone: 'positive' },
  final: { label: 'Final', tone: 'neutral' },
  halftime: { label: 'Halftime', tone: 'brand' },
};

export function StatusPill({ status, label, size, className }: StatusPillProps) {
  const { label: defaultLabel, tone } = defaults[status];
  return (
    <Chip
      tone={tone}
      size={size}
      className={cn('uppercase', className)}
      data-status={status}
      leading={
        status === 'live' ? (
          <span aria-hidden="true" className="size-2 rounded-full bg-live motion-safe:animate-live-pulse" />
        ) : undefined
      }
    >
      {label ?? defaultLabel}
    </Chip>
  );
}
