'use client';

import Link from 'next/link';
import { Card, GameStatusLabel, RankBadge, Skeleton, TeamLogo, cn } from '@pll/ui';
import type { GameSummary } from '@pll/data/api';
import { useScoreboard, useServerNow } from '@/api/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { groupGames, type GameBucket } from '@/lib/game-order';

const GROUPS: { bucket: GameBucket; title: string }[] = [
  { bucket: 'live', title: 'Live now' },
  { bucket: 'upcoming', title: 'Upcoming' },
  { bucket: 'completed', title: 'Final' },
];

/**
 * Scoreboard for local dev and direct use (production Vercel redirects `/` to the Lab): today's slate grouped
 * live / upcoming / final, in the same order as the Other Games bar, each game linking to its gamecast.
 */
export function HomeScreen() {
  const query = useScoreboard();
  const clockNow = useServerNow({ tickMs: 30_000 });
  const nowMs = clockNow ?? (query.data ? Date.parse(query.data.meta.serverTime) : 0);

  return (
    <main className="mx-auto w-full max-w-page px-4 py-8 md:px-6">
      <h1 className="mb-1 text-title1">NCAA Gamecast</h1>
      <p className="mb-6 text-callout text-text-secondary">Pick a game to open its gamecast.</p>
      <QueryBoundary
        query={query}
        label="Scoreboard"
        isEmpty={({ data }) => data.games.length === 0}
        empty={{ title: 'No games scheduled', message: 'Check back soon.' }}
        loading={
          <div className="flex flex-col gap-2" role="status" aria-busy="true" aria-label="Loading games">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant="rect" className="h-24 w-full" />
            ))}
          </div>
        }
      >
        {({ data }) => {
          const groups = groupGames(data.games);
          return (
            <div className="flex flex-col gap-8">
              {GROUPS.filter(({ bucket }) => groups[bucket].length > 0).map(({ bucket, title }) => (
                <section key={bucket} aria-labelledby={`slate-${bucket}`}>
                  <h2 id={`slate-${bucket}`} className="mb-3 text-title3 uppercase">
                    {title}
                  </h2>
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {groups[bucket].map((game) => (
                      <li key={game.id}>
                        <GameRow game={game} bucket={bucket} nowMs={nowMs} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          );
        }}
      </QueryBoundary>
    </main>
  );
}

function GameRow({ game, bucket, nowMs }: { game: GameSummary; bucket: GameBucket; nowMs: number }) {
  const showScore = bucket !== 'upcoming';
  const a = game.away.score ?? 0;
  const h = game.home.score ?? 0;
  const loser = bucket === 'completed' && a !== h ? (a > h ? 'home' : 'away') : null;
  const title = `${game.away.team.school} at ${game.home.team.school}`;
  return (
    <Link
      href={`/ncaa/game/${encodeURIComponent(game.id)}/`}
      aria-label={`${title}${showScore ? `, ${a} to ${h}` : ''}`}
      className="block rounded-md"
    >
      <Card padding="md" className="flex items-center gap-3 hover:bg-surface-raised">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {(['away', 'home'] as const).map((side) => {
            const s = game[side];
            return (
              <div key={side} className="flex items-center gap-2">
                <TeamLogo
                  src={s.team.logoUrl}
                  name={s.team.school}
                  abbreviation={s.team.abbreviation}
                  color={s.team.colors.primary}
                  size="sm"
                  decorative
                />
                {s.rank !== null && <RankBadge rank={s.rank} />}
                <span className={cn('min-w-0 flex-1 truncate text-headline', loser === side && 'text-text-secondary')}>
                  {s.team.school}
                </span>
                {showScore && (
                  <span
                    aria-hidden="true"
                    className={cn('font-display text-score tabular-nums', loser === side && 'text-text-secondary')}
                  >
                    {s.score ?? '–'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <GameStatusLabel game={game} nowMs={nowMs} variant="stacked" className="w-20 shrink-0 text-center" />
      </Card>
    </Link>
  );
}
