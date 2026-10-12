import type { CSSProperties } from 'react';
import type { GameDetail, Play, PlayerRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { clock, periodLabel, playerShortName } from '../../lib/format';
import { Card } from '../../atoms/Card';
import { LiveDot } from '../../atoms/LiveDot';
import { Skeleton } from '../../atoms/Skeleton';
import { TeamLogo } from '../../atoms/TeamLogo';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { TeamScope } from '../../molecules/TeamScope';
import { latestGoal, maxGoalsInPeriod, quarterFlows, type FlowSide, type GoalEvent, type QuarterFlow } from './gameFlow.logic';

export interface GameFlowProps {
  /** `GameDetail['data']` (a `GameSummary` with periods and teams is enough). */
  game: GameDetail['data'];
  /** `GamePlays['data']['plays']`. Only goal plays are read. */
  plays: readonly Play[];
  /** `GamePlays['data']['playerRefs']`: names for the latest-goal callout. */
  playerRefs: readonly PlayerRef[];
  /** Section title. Default "Game flow". */
  title?: string;
  /** Show the skeleton instead of the content. */
  loading?: boolean;
  className?: string;
}

const SIDES: readonly FlowSide[] = ['away', 'home'];

/** One team's goals in one period: a segment per goal, all the same width, sized against the busiest lane of the game. */
function Lane({ goals, slots, latest }: { goals: GoalEvent[]; slots: number; latest: string | null }) {
  // The number of columns is data (goals per period), so it cannot be a static utility.
  const style: CSSProperties = { gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` };
  return (
    <div aria-hidden="true" style={style} className="grid h-2.5 gap-0.5">
      {goals.length === 0 ? (
        <span className="col-span-full rounded-xs bg-surface-track" />
      ) : (
        goals.map((g) => (
          <span
            key={g.play.id}
            data-latest={g.play.id === latest ? '' : undefined}
            // The outline keeps dark team colors (navy on a dark card) visible; the latest goal gets a gold one.
            className={cn('rounded-xs bg-team-primary', g.play.id === latest ? 'border-2 border-accent-gold' : 'border border-text-tertiary')}
          />
        ))
      )}
    </div>
  );
}

function QuarterRow({ row, game, slots, latest }: { row: QuarterFlow; game: GameDetail['data']; slots: number; latest: string | null }) {
  const spoken = `${row.label}: ${game.away.team.school} ${row.counts.away}, ${game.home.team.school} ${row.counts.home}`;
  return (
    <li className="grid grid-cols-[2.5rem_1.25rem_minmax(0,1fr)_1.25rem] items-center gap-x-2 gap-y-1" aria-current={row.inProgress ? 'step' : undefined}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className={cn('row-span-2 inline-flex items-center gap-1 text-footnote font-semibold', row.inProgress ? 'text-status-live' : 'text-text-primary')}>
        {row.label}
        {row.inProgress && <LiveDot size="sm" />}
      </span>
      {SIDES.map((side) => (
        <TeamScope key={side} team={game[side].team} className="contents">
          <TeamLogo
            src={game[side].team.logoUrl}
            name={game[side].team.school}
            abbreviation={game[side].team.abbreviation}
            color={game[side].team.colors.primary}
            size="xs"
            decorative
          />
          <Lane goals={row.goals[side]} slots={slots} latest={latest} />
          <span aria-hidden="true" className="text-right text-caption tabular-nums text-text-secondary">
            {row.counts[side]}
          </span>
        </TeamScope>
      ))}
    </li>
  );
}

function ScoreInfo({ game, goal, playerRefs }: { game: GameDetail['data']; goal: GoalEvent; playerRefs: readonly PlayerRef[] }) {
  const { play, side } = goal;
  const team = game[side].team;
  const byId = (id: string | null) => (id ? playerRefs.find((p) => p.id === id) : undefined);
  const scorer = byId(play.playerId);
  const assist = byId(play.assistPlayerId);
  // Fall back to the server-rendered description when the roster does not know the scorer.
  const headline = scorer ? `GOAL by ${playerShortName(scorer)}` : play.description || 'GOAL';
  return (
    <Card tone="track" bordered={false} padding="sm" className="@container border-l-4 border-accent-gold">
      <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center @sm:gap-4">
        <h3 className="text-subhead font-semibold text-text-primary @sm:w-16 @sm:shrink-0">Score Info</h3>
        <div aria-live="polite" className="flex min-w-0 items-center gap-2.5">
          <TeamLogo src={team.logoUrl} name={`${team.school} ${team.mascot}`} abbreviation={team.abbreviation} color={team.colors.primary} size="md" decorative />
          <div className="flex min-w-0 flex-col">
            <span className="text-caption tabular-nums text-text-secondary">
              {periodLabel(play.period)} {clock(play.clockSeconds)} · {game.away.team.abbreviation} {play.awayScore}–{play.homeScore} {game.home.team.abbreviation}
            </span>
            <span className="text-footnote font-semibold text-text-primary">{headline}</span>
            {assist && <span className="text-caption text-text-secondary">Assist {playerShortName(assist)}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function GameFlowSkeleton({ className }: { className?: string }) {
  return (
    <Card as="section" aria-busy="true" aria-label="Loading game flow" className={className}>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rect" className="h-6 w-full" />
        ))}
      </div>
    </Card>
  );
}

/**
 * Quarter-by-quarter scoring summary for live and final games (the "SUMMARY" block). One row per started period; in it,
 * a lane for each team (away on top, home below) with a segment per goal, in the team color, plus the goal count.
 * Under the rows, "Score Info" calls out the latest goal. Readable down to 320px.
 */
export function GameFlow({ game, plays, playerRefs, title = 'Game flow', loading = false, className }: GameFlowProps) {
  if (loading) return <GameFlowSkeleton className={className} />;

  const rows = quarterFlows(game, plays);
  const goal = latestGoal(game, plays);
  const slots = maxGoalsInPeriod(rows);

  return (
    <Card as="section" aria-label={title} className={cn('@container', className)}>
      <SectionHeader title={title} />
      {rows.length === 0 ? (
        <EmptyState icon="lacrosse-field" message="The game flow appears once the game starts." />
      ) : (
        <div className="flex flex-col gap-3">
          <ol aria-label="Goals by period" className="flex flex-col gap-3">
            {rows.map((row) => (
              <QuarterRow key={row.period} row={row} game={game} slots={slots} latest={goal?.play.id ?? null} />
            ))}
          </ol>
          {goal ? (
            <ScoreInfo game={game} goal={goal} playerRefs={playerRefs} />
          ) : (
            <p aria-live="polite" className="text-footnote text-text-tertiary">
              No goals yet.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
