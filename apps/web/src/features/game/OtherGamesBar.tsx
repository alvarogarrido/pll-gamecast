'use client';

import Link from 'next/link';
import { Skeleton, StatusPill, TeamLogo, cn } from '@pll/ui';
import type { GameSummary } from '@pll/data/api';
import { useScoreboard } from '@/api/queries';
import { statusPillProps } from '@/lib/format';

/** PRD module: OtherGamesBar. Horizontally scrollable strip of today's games. PLACEHOLDER visuals. */
export function OtherGamesBar({ currentGameId }: { currentGameId: string }) {
  const { data, isPending, isError } = useScoreboard();
  const games = data?.data.games ?? [];

  return (
    <nav aria-label="Other games" className="border-b border-border-subtle bg-surface-nav">
      <div className="mx-auto w-full max-w-page px-4 py-2 md:px-6">
        {isPending ? (
          <div className="flex gap-2" aria-busy="true" aria-label="Loading other games">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant="rect" className="h-14 w-40 shrink-0" />
            ))}
          </div>
        ) : isError && games.length === 0 ? (
          <p className="py-2 text-chip text-text-tertiary">Other games are unavailable right now.</p>
        ) : games.length === 0 ? (
          <p className="py-2 text-chip text-text-tertiary">No other games today.</p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {games.map((game) => (
              <li key={game.id} className="shrink-0">
                <GameChip game={game} current={game.id === currentGameId} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}

function GameChip({ game, current }: { game: GameSummary; current: boolean }) {
  const pill = statusPillProps(game);
  return (
    <Link
      href={`/ncaa/game/${encodeURIComponent(game.id)}/`}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex min-h-14 w-44 flex-col justify-center gap-1 rounded-md border px-3 py-2',
        current ? 'border-brand-primary bg-surface-card' : 'border-border-subtle bg-surface-card hover:border-border-default',
      )}
    >
      {[game.away, game.home].map((side) => (
        <span key={side.team.id} className="flex items-center gap-2 text-chip">
          <TeamLogo src={side.team.logoUrl} name={side.team.school} abbreviation={side.team.abbreviation} size="xs" decorative />
          <span className="flex-1 truncate">{side.team.abbreviation}</span>
          <span className="tabular-nums">{side.score ?? ''}</span>
        </span>
      ))}
      <StatusPill {...pill} size="sm" className="self-start" />
    </Link>
  );
}
