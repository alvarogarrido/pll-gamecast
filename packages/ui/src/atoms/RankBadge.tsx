import { cn } from '../lib/cn';

export type RankKind = 'rank' | 'rpi' | 'seed';

export interface RankBadgeProps {
  /** Position. `null` renders nothing (unranked teams show no badge). */
  rank: number | null;
  /** `rank` = national poll ("#3"), `rpi` = "RPI 12", `seed` = tournament seed ("Seed 2"). */
  kind?: RankKind;
  /** Movement since the last poll. Positive = moved up, negative = down, 0/null = hidden. */
  change?: number | null;
  className?: string;
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" className={cn('size-2', !up && 'rotate-180')}>
      <path d="M4 1.5 7.5 6.5h-7z" fill="currentColor" />
    </svg>
  );
}

export function RankBadge({ rank, kind = 'rank', change = null, className }: RankBadgeProps) {
  if (rank === null) return null;

  const text = kind === 'rank' ? `#${rank}` : kind === 'rpi' ? `RPI ${rank}` : `Seed ${rank}`;
  const spoken = kind === 'rank' ? `Ranked number ${rank}` : kind === 'rpi' ? `RPI ${rank}` : `Seed ${rank}`;
  const moved = change !== null && change !== 0;

  return (
    <span className={cn('inline-flex items-center gap-1 text-chip', className)}>
      <span
        aria-label={spoken}
        className={cn(
          'font-bold tabular-nums',
          kind === 'rank' ? 'text-brand-primary' : 'text-text-secondary',
        )}
      >
        {text}
      </span>
      {moved && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 font-medium tabular-nums',
            change > 0 ? 'text-positive' : 'text-negative',
          )}
        >
          <Arrow up={change > 0} />
          <span aria-hidden="true">{Math.abs(change)}</span>
          <span className="sr-only">{change > 0 ? `up ${change}` : `down ${Math.abs(change)}`}</span>
        </span>
      )}
    </span>
  );
}
