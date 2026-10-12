import { useId } from 'react';
import type { GameDetail, GamePreview } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { PlayerAvatar } from '../../atoms/PlayerAvatar';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { ComparisonBar } from '../../molecules/ComparisonBar';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';
import { pct } from '../../lib/format';
import { teamColorVars } from '../../lib/team-style';
import { resolvePicks, tallyPicks, winSplit } from './picks.logic';

type Team = GameDetail['data']['home']['team'];

export interface WinPredictionsProps {
  game: GameDetail['data'];
  /** `GamePreview['data']['staffPicks']`. */
  staffPicks: GamePreview['data']['staffPicks'];
  loading?: boolean;
  className?: string;
}

function ProbabilityTile({ team, probability, favorite }: { team: Team; probability: number | null; favorite: boolean }) {
  return (
    <div
      style={teamColorVars(team.colors.primary, team.colors.secondary)}
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 rounded-sm border bg-surface-track p-2',
        favorite ? 'border-accent-gold' : 'border-border-hairline',
      )}
    >
      <TeamLogo src={team.logoUrl} name={`${team.school} ${team.mascot}`} abbreviation={team.abbreviation} color={team.colors.primary} size="md" decorative />
      <span className="max-w-full truncate text-footnote font-semibold text-text-primary">{team.school}</span>
      <span className={cn('font-display text-score tabular-nums', favorite ? 'text-accent-gold' : 'text-text-primary')}>
        {pct(probability, 0)}
      </span>
    </div>
  );
}

/**
 * Win Predictions [Pre/Live]: the win probability (a tile per team plus a split bar in team colors) and "IL Staff Picks":
 * staff photo, name and the picked team's logo for each pick, with a tally ("3 of 4 pick Duke").
 * Adapted from the PLL Pick 'Em widget: staff picks instead of a fan vote.
 */
export function WinPredictions({ game, staffPicks, loading = false, className }: WinPredictionsProps) {
  const titleId = useId();
  const picksId = useId();
  const split = winSplit(game.winProbabilityHome);
  const resolved = resolvePicks(staffPicks, game);
  const tally = tallyPicks(staffPicks, game);
  const awayFavored = split !== null && split.away > split.home;
  const homeFavored = split !== null && split.home > split.away;

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-4', className)}>
      <SectionHeader title={<span id={titleId}>Win predictions</span>} />
      {loading ? (
        <WinPredictionsSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-subhead font-semibold text-text-secondary">Win probability</h3>
            {split ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ProbabilityTile team={game.away.team} probability={split.away} favorite={awayFavored} />
                  <ProbabilityTile team={game.home.team} probability={split.home} favorite={homeFavored} />
                </div>
                <ComparisonBar
                  away={split.away}
                  home={split.home}
                  awayColor={game.away.team.colors.primary}
                  homeColor={game.home.team.colors.primary}
                  awayName={game.away.team.school}
                  homeName={game.home.team.school}
                  format="pct"
                  digits={0}
                />
              </>
            ) : (
              <p className="text-footnote text-text-tertiary">Win probability is not available yet.</p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border-hairline pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 id={picksId} className="text-subhead font-semibold text-text-secondary">
                IL staff picks
              </h3>
              {tally.text && (
                <p className="text-footnote font-semibold text-accent-gold" data-testid="pick-tally">
                  {tally.text}
                </p>
              )}
            </div>
            {resolved.length === 0 ? (
              <p className="text-footnote text-text-tertiary">Staff picks arrive closer to game time.</p>
            ) : (
              <ul aria-labelledby={picksId} className="flex flex-col gap-2">
                {resolved.map(({ pick, team }) => (
                  <li key={pick.staff.id} className="flex items-center justify-between gap-2 rounded-sm bg-surface-track p-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <PlayerAvatar photoUrl={pick.staff.photoUrl} name={pick.staff.name} fallback="initials" size="sm" decorative />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-footnote font-semibold text-text-primary">{pick.staff.name}</span>
                        {pick.staff.title && <span className="truncate text-caption text-text-secondary">{pick.staff.title}</span>}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-caption text-text-secondary">
                        <span className="sr-only">Picks </span>
                        {team.abbreviation}
                      </span>
                      <TeamLogo src={team.logoUrl} name={`${team.school} ${team.mascot}`} abbreviation={team.abbreviation} color={team.colors.primary} size="sm" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export function WinPredictionsSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status">
      <span className="sr-only">Loading win predictions</span>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton variant="rect" className="h-24" />
        <Skeleton variant="rect" className="h-24" />
      </div>
      <Skeleton className="h-2 rounded-pill" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rect" className="h-12 w-full" />
      ))}
    </div>
  );
}
