'use client';

import { useGameMedia, useGamePlays, useGameStats } from '@/api/queries';
import { ModulePlaceholder } from './ModulePlaceholder';

/** Stats tab: box score + top performers. PLACEHOLDER. */
export function StatsSection({ gameId }: { gameId: string }) {
  const stats = useGameStats(gameId);
  return (
    <ModulePlaceholder
      name="BoxScore"
      endpoint="/stats"
      query={stats}
      summarize={({ data }) => `${data.players.length} player lines`}
    />
  );
}

/** Plays tab: full play-by-play. PLACEHOLDER. */
export function PlaysSection({ gameId }: { gameId: string }) {
  const plays = useGamePlays(gameId);
  return (
    <ModulePlaceholder
      name="PlayByPlay"
      endpoint="/plays"
      query={plays}
      isEmpty={({ data }) => data.plays.length === 0}
      summarize={({ data }) => `${data.plays.length} plays`}
    />
  );
}

/** Highlights tab: videos + articles. PLACEHOLDER. */
export function HighlightsSection({ gameId }: { gameId: string }) {
  const media = useGameMedia(gameId);
  return (
    <ModulePlaceholder
      name="Highlights"
      endpoint="/media"
      query={media}
      isEmpty={({ data }) => data.videos.length === 0 && data.articles.length === 0}
      summarize={({ data }) => `${data.videos.length} videos, ${data.articles.length} articles`}
    />
  );
}
