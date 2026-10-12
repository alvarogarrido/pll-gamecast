'use client';

import { useId } from 'react';
import { Icon } from '@pll/icons';
import { Card } from '../../atoms/Card';
import { MediaImage } from '../../atoms/MediaImage';
import { Skeleton } from '../../atoms/Skeleton';
import { CarouselControls, CarouselRail, useCarousel } from '../../molecules/Carousel';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';
import { relativeTimeLabel } from '../../lib/format';
import { durationLabel, type VideoItem } from '../VideoPlayer/video.logic';

export interface HighlightsCarouselProps {
  /** `GameMedia['data']['videos']`, in the order to show them (see `orderVideos`). */
  videos: VideoItem[];
  /** Id of the video loaded in the player: its card is marked "Now playing". */
  selectedId?: string | null;
  /** Called when a card is chosen. Without it the cards are inert. */
  onSelect?: (video: VideoItem) => void;
  /** Server time in ms (`meta.serverTime`) for the "2h ago" labels. */
  nowMs: number;
  title?: string;
  /** Message when `videos` is empty. */
  emptyMessage?: string;
  /** Show as a bare block inside another card (no card chrome, no header). */
  bare?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Highlights carousel [Post]: scroll-snap list of video cards (thumbnail with a play overlay and duration badge, title,
 * published-ago) with prev/next buttons. Choosing a card calls `onSelect`, so a parent can load it in the player.
 */
export function HighlightsCarousel({
  videos,
  selectedId = null,
  onSelect,
  nowMs,
  title = 'Highlights',
  emptyMessage = 'Highlights are posted once the game is under way.',
  bare = false,
  loading = false,
  className,
}: HighlightsCarouselProps) {
  const titleId = useId();
  const carousel = useCarousel();

  const body = loading ? (
    <div className="flex gap-3" role="status">
      <span className="sr-only">Loading videos</span>
      {[0, 1].map((i) => (
        <Skeleton key={i} variant="rect" className="h-40 w-64 shrink-0" />
      ))}
    </div>
  ) : videos.length === 0 ? (
    <EmptyState icon="highlights" title="No videos yet" message={emptyMessage} />
  ) : (
    <CarouselRail label={title} carousel={carousel}>
      {videos.map((video) => {
        const selected = video.id === selectedId;
        return (
          <li key={video.id} className="w-64 shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onSelect?.(video)}
              disabled={!onSelect}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'group flex h-full w-full flex-col gap-2 rounded-sm border p-2 text-left enabled:hover:bg-surface-raised',
                selected ? 'border-accent-gold bg-accent-gold-subtle' : 'border-transparent bg-surface-track',
              )}
            >
              <span className="relative block">
                <MediaImage src={video.thumbnailUrl} placeholderIcon="highlights" />
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-page/80 text-text-primary group-enabled:group-hover:bg-accent-gold group-enabled:group-hover:text-text-on-accent">
                    <Icon name="play-filled" size={20} />
                  </span>
                </span>
                <span className="absolute bottom-1 right-1 rounded-xs bg-surface-page/80 px-1 text-caption2 tabular-nums text-text-primary">
                  <span className="sr-only">Duration </span>
                  {durationLabel(video.durationSeconds)}
                </span>
              </span>
              <span className="line-clamp-2 min-h-10 text-subhead font-semibold text-text-primary">{video.title}</span>
              <span className="flex items-center justify-between gap-2 text-caption text-text-secondary">
                <time dateTime={video.publishedAt}>{relativeTimeLabel(video.publishedAt, nowMs)}</time>
                {selected && <span className="font-semibold text-accent-gold">Now playing</span>}
              </span>
            </button>
          </li>
        );
      })}
    </CarouselRail>
  );

  if (bare) return <div className={className}>{body}</div>;

  const showControls = !loading && videos.length > 0;
  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader
        title={<span id={titleId}>{title}</span>}
        action={
          showControls ? (
            <CarouselControls canPrev={carousel.canPrev} canNext={carousel.canNext} onPrev={carousel.prev} onNext={carousel.next} label="videos" />
          ) : undefined
        }
      />
      {body}
    </Card>
  );
}
