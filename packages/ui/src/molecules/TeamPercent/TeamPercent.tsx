import type { TeamRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { pct } from '../../lib/format';
import { teamColorVars } from '../../lib/team-style';
import { TeamLogo } from '../../atoms/TeamLogo';

export type TeamPercentLayout = 'inline' | 'tile';
export type TeamPercentSide = 'away' | 'home';

export interface TeamPercentProps {
  team: TeamRef;
  /** Fraction 0..1 (a win probability, a share). `null` shows an en dash. */
  value: number | null;
  /** `inline` mirrors for the home side (logo on the right, right-aligned). Ignored by `tile`. Default `away`. */
  side?: TeamPercentSide;
  /**
   * `inline` (default): logo, a team-color dot with the abbreviation, and the big number, in a row (chart header).
   * `tile`: a bordered card with the logo, school name and number stacked, for a 2-up grid.
   */
  layout?: TeamPercentLayout;
  /** Highlight the favorite: gold border and number (`tile` only). */
  highlighted?: boolean;
  /** Digits of the percentage. Default 1 (`43.3%`); use 0 for a coarse `43%`. */
  digits?: number;
  /**
   * Color for the dot and the logo ring on dark surfaces. Defaults to the team's primary made visible on dark; pass one
   * half of `teamPairColors(away, home)` when both teams are shown together.
   */
  color?: string;
  className?: string;
}

/** A team and its percentage: the Win Probability header (`inline`) or a Win Predictions tile (`tile`). */
export function TeamPercent({ team, value, side = 'away', layout = 'inline', highlighted = false, digits = 1, color, className }: TeamPercentProps) {
  const logo = (
    <TeamLogo
      src={team.logoUrl}
      name={`${team.school} ${team.mascot}`}
      abbreviation={team.abbreviation}
      color={color ?? team.colors.primary}
      size={layout === 'tile' ? 'md' : 'sm'}
      decorative
    />
  );
  const style = teamColorVars(team.colors.primary, team.colors.secondary, color);

  if (layout === 'tile') {
    return (
      <div
        data-layout="tile"
        style={style}
        className={cn(
          'flex min-w-0 flex-col items-center gap-1 rounded-sm border bg-surface-track p-2',
          highlighted ? 'border-accent-gold' : 'border-border-hairline',
          className,
        )}
      >
        {logo}
        <span className="max-w-full truncate text-footnote font-semibold text-text-primary">{team.school}</span>
        <span className={cn('font-display text-score tabular-nums', highlighted ? 'text-accent-gold' : 'text-text-primary')}>{pct(value, digits)}</span>
      </div>
    );
  }

  return (
    <div data-side={side} data-layout="inline" style={style} className={cn('flex items-center gap-2', side === 'home' && 'flex-row-reverse text-right', className)}>
      {logo}
      <div className="flex flex-col">
        <span className={cn('flex items-center gap-1 text-caption text-text-secondary', side === 'home' && 'flex-row-reverse')}>
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full border border-border-hairline bg-team-primary-on-dark" />
          {team.abbreviation}
        </span>
        <span className="font-display text-score tabular-nums text-text-primary">{pct(value, digits)}</span>
      </div>
    </div>
  );
}
