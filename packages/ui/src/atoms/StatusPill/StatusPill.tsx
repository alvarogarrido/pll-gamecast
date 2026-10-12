import { cn } from '../../lib/cn';
import { Chip, type ChipSize, type ChipTone } from '../Chip/Chip';
import { LiveDot } from '../LiveDot/LiveDot';

export type GameStatusKind = 'scheduled' | 'live' | 'final' | 'halftime';

export interface StatusPillProps {
  status: GameStatusKind;
  /** Overrides the default text, e.g. "Q3 4:12" while live or "7:00 PM" before the game. */
  label?: string;
  size?: ChipSize;
  /** Upper-case the text (default). Turn off for sentence-style labels such as "Starts in 2h 5m". */
  uppercase?: boolean;
  className?: string;
}

const defaults: Record<GameStatusKind, { label: string; tone: ChipTone }> = {
  scheduled: { label: 'Scheduled', tone: 'outline' },
  live: { label: 'Live', tone: 'live' },
  final: { label: 'Final', tone: 'neutral' },
  halftime: { label: 'Halftime', tone: 'gold' },
};

export function StatusPill({ status, label, size, uppercase = true, className }: StatusPillProps) {
  const { label: defaultLabel, tone } = defaults[status];
  return (
    <Chip
      tone={tone}
      size={size}
      className={cn(uppercase && 'uppercase', className)}
      data-status={status}
      leading={
        status === 'live' ? <LiveDot /> : undefined
      }
    >
      {label ?? defaultLabel}
    </Chip>
  );
}
