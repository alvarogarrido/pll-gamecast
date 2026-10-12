'use client';

import { Card, RankBadge, Skeleton, StatusPill, TeamLogo } from '@pll/ui';
import type { GameDetail } from '@pll/data/api';
import { useGame, useServerNow } from '@/api/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { formatCountdown, formatStartTime, statusPillProps } from '@/lib/format';

type Game = GameDetail['data'];

/** PRD module: HeaderBar. Scoreboard for the selected game. PLACEHOLDER visuals. */
export function HeaderBar({ gameId }: { gameId: string }) {
  const query = useGame(gameId);
  return (
    <section aria-label="Game header">
      <QueryBoundary query={query} loading={<HeaderBarSkeleton />}>
        {({ data: game }) => <HeaderBarContent game={game} />}
      </QueryBoundary>
    </section>
  );
}

function HeaderBarSkeleton() {
  return (
    <Card tone="scoreboard" bordered aria-busy="true" aria-label="Loading game">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {[0, 1].map((i) => (
          <div key={i} className={i === 0 ? 'order-1' : 'order-3'}>
            <div className="flex flex-col items-center gap-2">
              <Skeleton variant="circle" className="size-14" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        ))}
        <Skeleton className="order-2 h-6 w-16 rounded-full" />
      </div>
    </Card>
  );
}

function HeaderBarContent({ game }: { game: Game }) {
  const serverNow = useServerNow({ tickMs: 30_000 });
  const pill = statusPillProps(game);
  const countdown = game.status === 'scheduled' ? formatCountdown(game.startTime, serverNow) : null;

  return (
    <Card tone="scoreboard" bordered padding="lg">
      <h1 className="sr-only">
        {game.away.team.school} at {game.home.team.school}
      </h1>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <TeamBlock side={game.away} />
        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <StatusPill {...pill} />
          {game.status === 'scheduled' && (
            <>
              <p className="text-chip text-text-secondary">{formatStartTime(game.startTime)}</p>
              {countdown && <p className="text-chip text-text-tertiary">{countdown}</p>}
            </>
          )}
          <p className="max-w-32 text-chip text-text-tertiary">{game.venue.name}</p>
        </div>
        <TeamBlock side={game.home} />
      </div>
    </Card>
  );
}

function TeamBlock({ side }: { side: Game['home'] }) {
  const { team } = side;
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <TeamLogo src={team.logoUrl} name={team.school} abbreviation={team.abbreviation} color={team.colors.primary} size="lg" decorative />
      {/* fixed height keeps both team blocks aligned when only one side is ranked */}
      <div className="flex h-4 items-center">
        <RankBadge rank={side.rank} change={side.rankChange} />
      </div>
      <p className="max-w-full truncate text-team-name">{team.school}</p>
      <p className="text-chip text-text-secondary">
        {side.record.wins}-{side.record.losses} · {side.conferenceShortName}
      </p>
      <p className="text-score tabular-nums" aria-label={`Score ${side.score ?? 'not started'}`}>
        {side.score ?? '–'}
      </p>
    </div>
  );
}
