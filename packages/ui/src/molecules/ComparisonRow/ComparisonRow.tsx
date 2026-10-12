import { cn } from '../../lib/cn';
import { formatStat, type StatFormat } from '../../lib/format';
import { StatValue } from '../../atoms/StatValue';

export type ComparisonHighlight = 'auto' | 'away' | 'home' | 'none';

export interface ComparisonRowProps {
  /** Stat name, shown in the middle ("Shots", "Faceoff %"). */
  label: string;
  /** Away team's value (left). `null` shows an en dash and never wins. */
  away: number | null | undefined;
  /** Home team's value (right). */
  home: number | null | undefined;
  /** How both numbers are printed: `number` (default), `pct` (value is a fraction 0..1), `decimal`, or a function. */
  format?: StatFormat;
  /** Digits for `pct` / `decimal` / non-integer `number`. */
  digits?: number;
  /** Fewer is better (turnovers, penalties): the lower value gets the highlight. */
  lowerIsBetter?: boolean;
  /** `auto` (default) highlights the better side and nothing on a tie. Force a side, or `none`. */
  highlight?: ComparisonHighlight;
  /** Override the printed text (`"2 of 3"`) while `away` / `home` stay the numbers used to pick the leader. */
  awayDisplay?: string;
  homeDisplay?: string;
  /** Team names for the screen-reader summary of the leader ("Duke leads"). */
  awayName?: string;
  homeName?: string;
  className?: string;
}

/** Which side leads, or `null` on a tie / missing data. */
export function comparisonLeader(
  away: number | null | undefined,
  home: number | null | undefined,
  lowerIsBetter = false,
): 'away' | 'home' | null {
  if (typeof away !== 'number' || typeof home !== 'number' || Number.isNaN(away) || Number.isNaN(home)) return null;
  if (away === home) return null;
  return (away < home) === lowerIsBetter ? 'away' : 'home';
}

/**
 * Team Stats row: `away value | label | home value`. The better side's value sits in a `StatValue` chip.
 * Stack rows inside a `Card`; each row is a three-column grid so labels stay centered whatever the numbers.
 */
export function ComparisonRow({
  label,
  away,
  home,
  format = 'number',
  digits,
  lowerIsBetter = false,
  highlight = 'auto',
  awayDisplay,
  homeDisplay,
  awayName,
  homeName,
  className,
}: ComparisonRowProps) {
  const leader =
    highlight === 'auto' ? comparisonLeader(away, home, lowerIsBetter) : highlight === 'none' ? null : highlight;
  const leaderName = leader === 'away' ? awayName : leader === 'home' ? homeName : undefined;

  return (
    <div className={cn('grid min-h-10 grid-cols-3 items-center gap-2 py-1', className)} data-leader={leader ?? undefined}>
      <span className="justify-self-start">
        <StatValue highlighted={leader === 'away'}>{awayDisplay ?? formatStat(away, format, digits)}</StatValue>
      </span>
      <span className="text-center text-footnote text-text-primary">{label}</span>
      <span className="justify-self-end">
        <StatValue highlighted={leader === 'home'}>{homeDisplay ?? formatStat(home, format, digits)}</StatValue>
      </span>
      {leaderName && <span className="sr-only">{`${leaderName} leads`}</span>}
    </div>
  );
}
