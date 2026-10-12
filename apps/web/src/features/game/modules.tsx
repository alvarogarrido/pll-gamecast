'use client';

/**
 * One component per PRD module: it owns its endpoint (TanStack hook), its loading skeleton, and its error / empty
 * state (QueryBoundary), then hands plain props to the organism in @pll/ui. A module only fetches while it is
 * mounted, so a tab or phase that does not show it never requests its endpoint, and one failing endpoint only
 * affects the module that needs it.
 *
 * Modules take no props: the game, server time and tab navigation come from `useGameView()`.
 */
import { useState } from 'react';
import {
  ArticleCarousel,
  ArticleExcerpt,
  Card,
  ConferenceStandings,
  GameFlow,
  GameFlowSkeleton,
  GameStakes,
  HighlightsCarousel,
  HighlightsTab,
  InjuryReport,
  KeyTeamStats,
  KeyTeamStatsSkeleton,
  LatestPlays,
  LatestPlaysSkeleton,
  LiveInsights,
  LiveInsightsSkeleton,
  PlayByPlay,
  PlayByPlaySkeleton,
  PlayersToWatch,
  PlayersToWatchSkeleton,
  PreviousResults,
  StatsSection,
  StatsSectionSkeleton,
  TopPerformers,
  TopPerformersSkeleton,
  VenueInfo,
  VideoPlayer,
  WinPredictions,
  WinProbabilityChart,
  WinProbabilityChartSkeleton,
  featuredArticle,
  goalMarkers,
  nextVideo,
  orderVideos,
  otherArticles,
  previewVideo,
  type VideoItem,
} from '@pll/ui';
import {
  useGameInsights,
  useGameMedia,
  useGamePlays,
  useGamePreview,
  useGameStats,
  useWinProbability,
} from '@/api/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { useGameView } from './game-view';

const NO_PREVIEW_PLACEHOLDER = { home: [], away: [] };

// ---------------------------------------------------------------------------
// Pregame
// ---------------------------------------------------------------------------

export function GameStakesModule() {
  const { game } = useGameView();
  return <GameStakes game={game} />;
}

export function PlayersToWatchModule() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary query={query} label="Players to watch" loading={<PlayersToWatchSkeleton />}>
      {({ data }) => <PlayersToWatch preview={data} game={game} />}
    </QueryBoundary>
  );
}

/** Key team stats: season averages before the game (`/preview`), game totals during and after it (`/stats`). */
export function KeyTeamStatsModule({ source }: { source: 'season' | 'game' }) {
  return source === 'season' ? <KeyTeamStatsSeason /> : <KeyTeamStatsGame />;
}

function KeyTeamStatsSeason() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary query={query} label="Key team stats" loading={<KeyTeamStatsSkeleton />}>
      {({ data }) => <KeyTeamStats game={game} preview={data} />}
    </QueryBoundary>
  );
}

function KeyTeamStatsGame() {
  const { gameId, game, goToTab } = useGameView();
  const query = useGameStats(gameId);
  return (
    <QueryBoundary query={query} label="Key team stats" loading={<KeyTeamStatsSkeleton />}>
      {({ data }) => <KeyTeamStats game={game} stats={data} onSeeAll={() => goToTab('stats')} />}
    </QueryBoundary>
  );
}

/** Preview video: autoplays muted, recommends the next video when it ends. */
export function PreviewVideoModule() {
  const { gameId } = useGameView();
  const query = useGameMedia(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Game preview"
      loading={<VideoPlayer video={null} heading="Game preview" loading />}
    >
      {({ data }) => <PreviewVideo videos={data.videos} />}
    </QueryBoundary>
  );
}

function PreviewVideo({ videos }: { videos: VideoItem[] }) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const ordered = orderVideos(videos);
  const preview = previewVideo(videos) ?? ordered[0] ?? null;
  const current = ordered.find((v) => v.id === pickedId) ?? preview;
  // After the preview itself, recommend the best other video (highlights first); otherwise the one after the current.
  const next = !current
    ? null
    : current.id === preview?.id
      ? (ordered.find((v) => v.id !== current.id) ?? null)
      : nextVideo(ordered, current.id);
  return (
    <VideoPlayer
      key={current?.id}
      video={current}
      nextVideo={next}
      autoplay
      onSelectNext={(video) => setPickedId(video.id)}
      heading="Game preview"
    />
  );
}

/** Preview (pregame) or recap (postgame) article excerpt, plus a carousel of the other articles when there are any. */
export function ArticleModule({ kind }: { kind: 'preview' | 'recap' }) {
  const { gameId, nowMs } = useGameView();
  const query = useGameMedia(gameId);
  const label = kind === 'preview' ? 'Game preview article' : 'Game recap';
  return (
    <QueryBoundary
      query={query}
      label={label}
      loading={<ArticleExcerpt article={null} kind={kind} nowMs={nowMs} loading />}
    >
      {({ data }) => {
        const featured = featuredArticle(data.articles, kind);
        const others = otherArticles(data.articles, featured);
        return (
          <div className="flex flex-col gap-4">
            <ArticleExcerpt article={featured} kind={kind} nowMs={nowMs} />
            {others.length > 0 && <ArticleCarousel articles={others} nowMs={nowMs} />}
          </div>
        );
      }}
    </QueryBoundary>
  );
}

export function WinPredictionsModule() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Win predictions"
      loading={<WinPredictions game={game} staffPicks={[]} loading />}
    >
      {({ data }) => <WinPredictions game={game} staffPicks={data.staffPicks} />}
    </QueryBoundary>
  );
}

export function InjuryReportModule() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary query={query} label="Injury report" loading={<InjuryReport injuries={[]} game={game} loading />}>
      {({ data }) => <InjuryReport injuries={data.injuries} game={game} />}
    </QueryBoundary>
  );
}

export function ConferenceStandingsModule() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Conference standings"
      loading={<ConferenceStandings standings={[]} game={game} loading />}
    >
      {({ data }) => <ConferenceStandings standings={data.standings} game={game} />}
    </QueryBoundary>
  );
}

export function PreviousResultsModule() {
  const { gameId, game } = useGameView();
  const query = useGamePreview(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Previous results"
      loading={<PreviousResults previousResults={NO_PREVIEW_PLACEHOLDER} game={game} loading />}
    >
      {({ data }) => <PreviousResults previousResults={data.previousResults} game={game} />}
    </QueryBoundary>
  );
}

export function VenueInfoModule() {
  const { game } = useGameView();
  return <VenueInfo game={game} />;
}

// ---------------------------------------------------------------------------
// Live and postgame
// ---------------------------------------------------------------------------

export function GameFlowModule() {
  const { gameId, game } = useGameView();
  const query = useGamePlays(gameId);
  return (
    <QueryBoundary query={query} label="Game flow" loading={<GameFlowSkeleton />}>
      {({ data }) => <GameFlow game={game} plays={data.plays} playerRefs={data.playerRefs} />}
    </QueryBoundary>
  );
}

export function LatestPlaysModule() {
  const { gameId, game, goToTab } = useGameView();
  const query = useGamePlays(gameId);
  return (
    <QueryBoundary query={query} label="Latest plays" loading={<LatestPlaysSkeleton />}>
      {({ data }) => (
        <LatestPlays game={game} plays={data.plays} playerRefs={data.playerRefs} onSeeAll={() => goToTab('plays')} />
      )}
    </QueryBoundary>
  );
}

export function WinProbabilityModule() {
  const { gameId, game } = useGameView();
  const query = useWinProbability(gameId);
  // Goal dots come from the plays Game flow / Latest plays already load (same query key, so no extra request:
  // `enabled: false` only reads the shared cache). Until they are there the chart renders without dots.
  const plays = useGamePlays(gameId, { enabled: false }).data?.data;
  const goals = plays ? goalMarkers(plays.plays, game, plays.playerRefs) : undefined;
  return (
    <QueryBoundary query={query} label="Win probability" loading={<WinProbabilityChartSkeleton />}>
      {({ data }) => <WinProbabilityChart series={data} game={game} goals={goals} />}
    </QueryBoundary>
  );
}

export function LiveInsightsModule() {
  const { gameId, game } = useGameView();
  const query = useGameInsights(gameId);
  return (
    <QueryBoundary query={query} label="Live insights" loading={<LiveInsightsSkeleton />}>
      {({ data }) => <LiveInsights insights={data.insights} game={game} playerRefs={data.playerRefs} />}
    </QueryBoundary>
  );
}

export function TopPerformersModule() {
  const { gameId, game, goToTab } = useGameView();
  const query = useGameStats(gameId);
  return (
    <QueryBoundary query={query} label="Top performers" loading={<TopPerformersSkeleton />}>
      {({ data }) => <TopPerformers stats={data} game={game} onViewAll={() => goToTab('stats')} />}
    </QueryBoundary>
  );
}

/** Postgame: the video player with the carousel of every highlight under it. Choosing a card loads and plays it. */
export function PostHighlightsModule() {
  const { gameId, nowMs } = useGameView();
  const query = useGameMedia(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Highlights"
      loading={
        <div className="flex flex-col gap-4">
          <Card as="div">
            <VideoPlayer video={null} framed={false} heading="Highlights" loading />
          </Card>
          <HighlightsCarousel videos={[]} nowMs={nowMs} loading />
        </div>
      }
    >
      {({ data }) => <PostHighlights videos={data.videos} />}
    </QueryBoundary>
  );
}

function PostHighlights({ videos }: { videos: VideoItem[] }) {
  const { nowMs } = useGameView();
  const ordered = orderVideos(videos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);
  const current = ordered.find((v) => v.id === selectedId) ?? ordered[0] ?? null;
  const select = (video: { id: string }) => {
    setSelectedId(video.id);
    setPicked(true);
  };
  return (
    <div className="flex flex-col gap-4">
      <Card as="div">
        <VideoPlayer
          key={current?.id}
          framed={false}
          heading="Highlights"
          video={current}
          nextVideo={current ? nextVideo(ordered, current.id) : null}
          autoplay={picked}
          onSelectNext={select}
        />
      </Card>
      {ordered.length > 1 && (
        <HighlightsCarousel
          videos={ordered}
          selectedId={current?.id ?? null}
          onSelect={select}
          nowMs={nowMs}
          title="More videos"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export function StatsTab() {
  const { gameId, game } = useGameView();
  const query = useGameStats(gameId);
  return (
    <QueryBoundary query={query} label="Stats" loading={<StatsSectionSkeleton />}>
      {({ data }) => <StatsSection stats={data} game={game} />}
    </QueryBoundary>
  );
}

export function PlaysTab() {
  const { gameId, game } = useGameView();
  const query = useGamePlays(gameId);
  return (
    <QueryBoundary query={query} label="Play-by-play" loading={<PlayByPlaySkeleton />}>
      {({ data }) => <PlayByPlay plays={data.plays} playerRefs={data.playerRefs} game={game} />}
    </QueryBoundary>
  );
}

export function HighlightsTabModule() {
  const { gameId, nowMs } = useGameView();
  const query = useGameMedia(gameId);
  return (
    <QueryBoundary
      query={query}
      label="Highlights"
      loading={<HighlightsTab videos={[]} articles={[]} nowMs={nowMs} loading />}
    >
      {({ data }) => <HighlightsTab videos={data.videos} articles={data.articles} nowMs={nowMs} />}
    </QueryBoundary>
  );
}
