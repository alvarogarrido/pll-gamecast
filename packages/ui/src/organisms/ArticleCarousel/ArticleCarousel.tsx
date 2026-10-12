'use client';

import { useId } from 'react';
import { Card } from '../../atoms/Card';
import { MediaImage } from '../../atoms/MediaImage';
import { PlayerAvatar } from '../../atoms/PlayerAvatar';
import { Skeleton } from '../../atoms/Skeleton';
import { CarouselControls, CarouselRail, useCarousel } from '../../molecules/Carousel';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import type { ArticleWithAuthor } from '../ArticleExcerpt/article.logic';
import { cn } from '../../lib/cn';
import { relativeTimeLabel } from '../../lib/format';

export interface ArticleCarouselProps {
  /** `GameMedia['data']['articles']` (already without the featured one, see `otherArticles`). */
  articles: ArticleWithAuthor[];
  /** Server time in ms (`meta.serverTime`) for the "3h ago" labels. */
  nowMs: number;
  /** `carousel` (default): horizontal scroll-snap list with prev/next. `list`: vertical rows (Highlights tab). */
  layout?: 'carousel' | 'list';
  /** Section title. Default "More articles". */
  title?: string;
  /** Show as a bare block inside another card (no card chrome, no header). */
  bare?: boolean;
  loading?: boolean;
  className?: string;
}

function ArticleMeta({ article, nowMs }: { article: ArticleWithAuthor; nowMs: number }) {
  return (
    <span className="flex items-center gap-2 text-caption text-text-secondary">
      <PlayerAvatar photoUrl={article.author.photoUrl} name={article.author.name} fallback="initials" size="sm" decorative />
      <span className="truncate">
        {article.author.name} · <time dateTime={article.publishedAt}>{relativeTimeLabel(article.publishedAt, nowMs)}</time>
      </span>
    </span>
  );
}

/**
 * Other articles as a horizontal scroll-snap carousel with prev/next buttons (`layout="carousel"`), or as a vertical
 * list of rows (`layout="list"`). Each item links to the full article.
 */
export function ArticleCarousel({
  articles,
  nowMs,
  layout = 'carousel',
  title = 'More articles',
  bare = false,
  loading = false,
  className,
}: ArticleCarouselProps) {
  const titleId = useId();
  const carousel = useCarousel();
  const asList = layout === 'list';

  const body = loading ? (
    <div className="flex gap-3" role="status">
      <span className="sr-only">Loading articles</span>
      {[0, 1].map((i) => (
        <Skeleton key={i} variant="rect" className="h-40 w-64 shrink-0" />
      ))}
    </div>
  ) : articles.length === 0 ? (
    <EmptyState icon="info" title="No other articles" message="Related coverage will show up here." />
  ) : asList ? (
    <ul className="flex flex-col gap-3">
      {articles.map((a) => (
        <li key={a.id}>
          <a href={a.url} className="flex gap-3 rounded-sm bg-surface-track p-2 hover:bg-surface-raised">
            <MediaImage src={a.imageUrl} className="w-28 shrink-0 sm:w-40" />
            <span className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <span className="line-clamp-3 text-subhead font-semibold text-text-primary">{a.title}</span>
              <ArticleMeta article={a} nowMs={nowMs} />
            </span>
          </a>
        </li>
      ))}
    </ul>
  ) : (
    <CarouselRail label={title} carousel={carousel}>
      {articles.map((a) => (
        <li key={a.id} className="w-64 shrink-0 snap-start">
          <a href={a.url} className="flex h-full flex-col gap-2 rounded-sm bg-surface-track p-2 hover:bg-surface-raised">
            <MediaImage src={a.imageUrl} />
            <span className="line-clamp-2 min-h-10 text-subhead font-semibold text-text-primary">{a.title}</span>
            <ArticleMeta article={a} nowMs={nowMs} />
          </a>
        </li>
      ))}
    </CarouselRail>
  );

  if (bare) return <div className={className}>{body}</div>;

  const showControls = !asList && !loading && articles.length > 0;
  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader
        title={<span id={titleId}>{title}</span>}
        action={
          showControls ? (
            <CarouselControls
              canPrev={carousel.canPrev}
              canNext={carousel.canNext}
              onPrev={carousel.prev}
              onNext={carousel.next}
              label="articles"
            />
          ) : undefined
        }
      />
      {body}
    </Card>
  );
}
