'use client';

import Link from 'next/link';
import { Card, Skeleton, StatusPill, TeamLogo } from '@pll/ui';
import { useScoreboard } from '@/api/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { statusPillProps } from '@/lib/format';

/** Placeholder landing page: links to every game on the scoreboard. */
export function HomeScreen() {
  const query = useScoreboard();
  return (
    <main className="mx-auto w-full max-w-page px-4 py-8 md:px-6">
      <h1 className="mb-1 text-h2">NCAA Gamecast</h1>
      <p className="mb-6 text-body text-text-secondary">Pick a game to open its gamecast.</p>
      <QueryBoundary
        query={query}
        isEmpty={({ data }) => data.games.length === 0}
        empty={{ title: 'No games scheduled', message: 'Check back soon.' }}
        loading={
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading games">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant="rect" className="h-16 w-full" />
            ))}
          </div>
        }
      >
        {({ data }) => (
          <ul className="flex flex-col gap-2">
            {data.games.map((game) => (
              <li key={game.id}>
                <Link href={`/ncaa/game/${encodeURIComponent(game.id)}/`} className="block">
                  <Card tone="card" bordered padding="sm" className="flex items-center gap-3 hover:border-border-default">
                    <TeamLogo src={game.away.team.logoUrl} name={game.away.team.school} abbreviation={game.away.team.abbreviation} size="sm" decorative />
                    <span className="flex-1 truncate text-stat-label">
                      {game.away.team.school} at {game.home.team.school}
                    </span>
                    <TeamLogo src={game.home.team.logoUrl} name={game.home.team.school} abbreviation={game.home.team.abbreviation} size="sm" decorative />
                    <StatusPill {...statusPillProps(game)} size="sm" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </main>
  );
}
