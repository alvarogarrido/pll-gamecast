'use client';

import { useState } from 'react';
import type { GameMedia } from '@pll/data/api';
import { Card } from '../../atoms/Card';
import { ArticleCarousel } from '../ArticleCarousel/ArticleCarousel';
import { HighlightsCarousel } from '../HighlightsCarousel/HighlightsCarousel';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { nextVideo, orderVideos } from '../VideoPlayer/video.logic';
import { cn } from '../../lib/cn';

export interface HighlightsTabProps {
  /** `GameMedia['data']['videos']`. */
  videos: GameMedia['data']['videos'];
  /** `GameMedia['data']['articles']`. */
  articles: GameMedia['data']['articles'];
  /** Server time in ms (`meta.serverTime`). */
  nowMs: number;
  /** Video to load first. Defaults to the first of the ordered list (highlights first). */
  initialVideoId?: string;
  /** Autoplay the first video (muted; ignored under reduced motion). Videos the viewer picks always play. */
  autoplay?: boolean;
  /** `list` (default): the articles as a vertical list; `carousel`: horizontal scroll-snap. */
  articleLayout?: 'list' | 'carousel';
  loading?: boolean;
  className?: string;
}

/**
 * Highlights tab [Post]: the player on top, the carousel of every video below it (choosing one loads it into the
 * player and plays it), then all the related articles.
 */
export function HighlightsTab({
  videos,
  articles,
  nowMs,
  initialVideoId,
  autoplay = false,
  articleLayout = 'list',
  loading = false,
  className,
}: HighlightsTabProps) {
  const ordered = orderVideos(videos);
  const [selectedId, setSelectedId] = useState<string | null>(initialVideoId ?? null);
  const [picked, setPicked] = useState(false);
  const current = ordered.find((v) => v.id === selectedId) ?? ordered[0] ?? null;

  const select = (video: { id: string }) => {
    setSelectedId(video.id);
    setPicked(true);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Card as="div" className="flex flex-col gap-4">
        <VideoPlayer
          framed={false}
          heading="Highlights"
          video={current}
          nextVideo={current ? nextVideo(ordered, current.id) : null}
          autoplay={autoplay || picked}
          onSelectNext={select}
          loading={loading}
        />
      </Card>
      <HighlightsCarousel
        videos={ordered}
        selectedId={current?.id ?? null}
        onSelect={select}
        nowMs={nowMs}
        title="More videos"
        loading={loading}
      />
      <ArticleCarousel articles={articles} nowMs={nowMs} layout={articleLayout} title="Related articles" loading={loading} />
    </div>
  );
}
