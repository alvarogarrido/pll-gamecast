import { cn } from '../../lib/cn';

export type ScoreChipSide = 'away' | 'home';

export interface ScoreChipProps {
  /** Away team's score (left). */
  away: number;
  /** Home team's score (right). */
  home: number;
  /** Side to emphasise, normally the team that just scored. `null` / omitted: both read the same. */
  emphasis?: ScoreChipSide | null;
  /** Team names for the accessible label ("Score Duke 12, Notre Dame 11"). Default "Away" / "Home". */
  awayName?: string;
  homeName?: string;
  className?: string;
}

/**
 * Running score "12–11" (away first) in a small track-colored chip, the emphasised side in bold white. Exposed as one
 * `img` with a spoken label, the digits themselves are hidden from assistive tech.
 */
export function ScoreChip({ away, home, emphasis = null, awayName = 'Away', homeName = 'Home', className }: ScoreChipProps) {
  return (
    <span
      role="img"
      aria-label={`Score ${awayName} ${away}, ${homeName} ${home}`}
      data-emphasis={emphasis ?? undefined}
      className={cn('inline-flex items-center gap-1 rounded-xs bg-surface-track px-2 py-0.5 font-display text-clock tabular-nums', className)}
    >
      <span aria-hidden="true" className={cn(emphasis === 'away' ? 'font-extrabold text-text-primary' : 'text-text-secondary')}>
        {away}
      </span>
      <span aria-hidden="true" className="text-text-tertiary">
        –
      </span>
      <span aria-hidden="true" className={cn(emphasis === 'home' ? 'font-extrabold text-text-primary' : 'text-text-secondary')}>
        {home}
      </span>
    </span>
  );
}
