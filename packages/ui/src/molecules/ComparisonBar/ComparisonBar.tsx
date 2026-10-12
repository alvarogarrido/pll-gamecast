import { cn } from '../../lib/cn';
import { formatStat, type StatFormat } from '../../lib/format';
import { teamColorVars } from '../../lib/team-style';

export interface ComparisonBarProps {
  /** Away team's amount (left segment). Only the ratio matters. */
  away: number;
  /** Home team's amount (right segment). */
  home: number;
  /** Team colors (`team.colors.primary`). Without them the neutral team token is used. */
  awayColor?: string;
  homeColor?: string;
  /** Stat name shown between the two values. When omitted no value row is drawn. */
  label?: string;
  format?: StatFormat;
  digits?: number;
  /** Team names for the accessible description ("Shots: Duke 43, Notre Dame 50"). */
  awayName?: string;
  homeName?: string;
  className?: string;
}

/**
 * Two-team proportional bar in team colors, e.g. possession or shot share. Both zero draws an even, muted bar;
 * a zero on one side lets the other fill it. Exposed as a single `img` with a text description.
 */
export function ComparisonBar({
  away,
  home,
  awayColor,
  homeColor,
  label,
  format = 'number',
  digits,
  awayName = 'Away',
  homeName = 'Home',
  className,
}: ComparisonBarProps) {
  const a = Math.max(0, Number.isFinite(away) ? away : 0);
  const h = Math.max(0, Number.isFinite(home) ? home : 0);
  const total = a + h;
  const awayShare = total === 0 ? 50 : (a / total) * 100;
  const homeShare = 100 - awayShare;

  const awayText = formatStat(away, format, digits);
  const homeText = formatStat(home, format, digits);
  const description = `${label ? `${label}: ` : ''}${awayName} ${awayText}, ${homeName} ${homeText}`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label !== undefined && (
        <div aria-hidden="true" className="grid grid-cols-3 items-center text-footnote tabular-nums text-text-primary">
          <span className="justify-self-start">{awayText}</span>
          <span className="text-center text-text-secondary">{label}</span>
          <span className="justify-self-end">{homeText}</span>
        </div>
      )}
      <div role="img" aria-label={description} className="flex h-2 w-full gap-0.5 overflow-hidden rounded-pill">
        {awayShare > 0 && (
          <span
            data-side="away"
            // Inline width: a data-driven proportion cannot be a static utility.
            style={{ ...teamColorVars(awayColor), width: `${awayShare}%` }}
            className={cn('h-full', total === 0 ? 'bg-surface-selected' : 'bg-team-primary')}
          />
        )}
        {homeShare > 0 && (
          <span
            data-side="home"
            // Inline width: a data-driven proportion cannot be a static utility.
            style={{ ...teamColorVars(homeColor), width: `${homeShare}%` }}
            className={cn('h-full', total === 0 ? 'bg-surface-selected' : 'bg-team-primary')}
          />
        )}
      </div>
    </div>
  );
}
