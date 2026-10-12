import type { TeamRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { record as formatRecord } from '../../lib/format';
import { RankBadge } from '../../atoms/RankBadge';
import { TeamLogo, type TeamLogoSize } from '../../atoms/TeamLogo';

export type TeamIdentityLayout = 'stacked' | 'inline';
export type TeamIdentitySize = 'sm' | 'md' | 'lg';
export type TeamIdentitySide = 'away' | 'home';
export type TeamNameStyle = 'school' | 'abbreviation' | 'full';

export interface TeamIdentityProps {
  team: TeamRef;
  /** `stacked` = logo above the text (game header), `inline` = logo beside it (rows, standings). Default `inline`. */
  layout?: TeamIdentityLayout;
  size?: TeamIdentitySize;
  /** Mirrors the layout for the home team (inline: logo on the right, text right-aligned). Default `away`. */
  side?: TeamIdentitySide;
  /** `school` ("Duke", default), `abbreviation` ("DUKE") or `full` ("Duke Blue Devils"). */
  nameStyle?: TeamNameStyle;
  /** National poll rank. `null` / omitted shows no badge. */
  rank?: number | null;
  /** Current record, e.g. `game.home.record`. Omit to hide. */
  record?: { wins: number; losses: number } | null;
  /**
   * Color of the logo's fallback ring. Defaults to the team's primary, made visible on dark. Pass one half of
   * `teamPairColors(away, home)` when both teams of a game are on screen, so look-alikes stay apart.
   */
  color?: string;
  className?: string;
}

const logoSize: Record<TeamIdentitySize, Record<TeamIdentityLayout, TeamLogoSize>> = {
  sm: { stacked: 'md', inline: 'sm' },
  md: { stacked: 'lg', inline: 'md' },
  lg: { stacked: 'xl', inline: 'lg' },
};

const nameText: Record<TeamIdentitySize, string> = {
  sm: 'text-footnote',
  md: 'text-subhead',
  lg: 'text-headline',
};

function displayName(team: TeamRef, style: TeamNameStyle): string {
  if (style === 'abbreviation') return team.abbreviation;
  if (style === 'full') return `${team.school} ${team.mascot}`;
  return team.school;
}

/**
 * Logo + rank + school + record. The accessible text is "Duke, ranked number 2, 4-1": the logo is decorative.
 * Use `side="home"` on the right-hand team so the pair mirrors around the score.
 */
export function TeamIdentity({
  team,
  layout = 'inline',
  size = 'md',
  side = 'away',
  nameStyle = 'school',
  rank = null,
  record,
  color,
  className,
}: TeamIdentityProps) {
  const mirrored = side === 'home';
  const stacked = layout === 'stacked';
  const name = displayName(team, nameStyle);

  return (
    <div
      data-side={side}
      data-layout={layout}
      className={cn(
        'flex min-w-0 gap-2.5',
        stacked ? 'flex-col items-center text-center' : mirrored ? 'flex-row-reverse items-center text-right' : 'flex-row items-center text-left',
        className,
      )}
    >
      <TeamLogo
        src={team.logoUrl}
        name={`${team.school} ${team.mascot}`}
        abbreviation={team.abbreviation}
        color={color ?? team.colors.primary}
        size={logoSize[size][layout]}
        decorative
      />
      <div className={cn('flex min-w-0 flex-col', stacked ? 'items-center' : mirrored ? 'items-end' : 'items-start')}>
        <div className={cn('flex min-w-0 items-center gap-1', mirrored && !stacked && 'flex-row-reverse')}>
          {rank !== null && <RankBadge rank={rank} />}
          <span className={cn('truncate font-semibold text-text-primary', nameText[size])}>{name}</span>
        </div>
        {record && <span className="text-caption tabular-nums text-text-secondary">{formatRecord(record)}</span>}
      </div>
    </div>
  );
}

