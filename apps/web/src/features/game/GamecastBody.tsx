'use client';

import { useGameInsights, useGamePlays, useGameStats, useWinProbability } from '@/api/queries';
import { ModulePlaceholder } from './ModulePlaceholder';

/**
 * PRD module: Gamecast body. One column on mobile, two on desktop (left 40% / right 60%).
 * The four modules below are placeholders named after what will live there.
 */
export function GamecastBody({ gameId }: { gameId: string }) {
  const winProbability = useWinProbability(gameId);
  const insights = useGameInsights(gameId);
  const stats = useGameStats(gameId);
  const plays = useGamePlays(gameId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
      <div className="flex flex-col gap-4">
        <ModulePlaceholder
          name="WinProbabilityChart"
          endpoint="/win-probability"
          query={winProbability}
          isEmpty={({ data }) => data.points.length === 0}
          summarize={({ data }) => `${data.points.length} data points`}
        />
        <ModulePlaceholder
          name="LiveInsights"
          endpoint="/insights"
          query={insights}
          isEmpty={({ data }) => data.insights.length === 0}
          summarize={({ data }) => `${data.insights.length} insights`}
        />
      </div>
      <div className="flex flex-col gap-4">
        <ModulePlaceholder
          name="KeyTeamStats"
          endpoint="/stats"
          query={stats}
          summarize={({ data }) => `${data.teams.length} teams, ${data.players.length} player lines`}
        />
        <ModulePlaceholder
          name="LatestPlays"
          endpoint="/plays"
          query={plays}
          isEmpty={({ data }) => data.plays.length === 0}
          summarize={({ data }) => `${data.plays.length} plays`}
        />
      </div>
    </div>
  );
}
