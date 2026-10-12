import { useId } from 'react';
import { Icon } from '@pll/icons';
import { Card } from '../../atoms/Card';
import { PlayerAvatar } from '../../atoms/PlayerAvatar';
import { Skeleton } from '../../atoms/Skeleton';
import { EmptyState } from '../../molecules/EmptyState';
import { SectionHeader } from '../../molecules/SectionHeader';
import { MediaImage } from '../ArticleCarousel/MediaImage';
import { cn } from '../../lib/cn';
import { keyQuote, publishedAgo, type ArticleKind, type ArticleWithAuthor } from './article.logic';

export interface ArticleExcerptProps {
  /** One entry of `GameMedia['data']['articles']`. `null` shows the empty state. */
  article: ArticleWithAuthor | null;
  /** `preview` (pregame) or `recap` (postgame): sets the section title and the empty message. */
  kind: ArticleKind;
  /** Server time in ms (from `meta.serverTime`), for the "3h ago" label. */
  nowMs: number;
  loading?: boolean;
  className?: string;
}

const copy: Record<ArticleKind, { title: string; empty: string }> = {
  preview: { title: 'Game preview', empty: 'The preview article is published a day before the game.' },
  recap: { title: 'Game recap', empty: 'The recap article is published after the final whistle.' },
};

/**
 * Preview / Recap article excerpt: 16:9 image (placeholder when missing), title, the key sentence as a pull quote, author
 * with photo, "published ago" and a "Read full article" link. Pair it with {@link ArticleCarousel} for the other articles.
 */
export function ArticleExcerpt({ article, kind, nowMs, loading = false, className }: ArticleExcerptProps) {
  const titleId = useId();
  const articleTitleId = useId();

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>{copy[kind].title}</span>} />
      {loading ? (
        <ArticleExcerptSkeleton />
      ) : !article ? (
        <EmptyState icon="info" title="Nothing published yet" message={copy[kind].empty} />
      ) : (
        <article aria-labelledby={articleTitleId} className="flex flex-col gap-3">
          <MediaImage src={article.imageUrl} />
          <h3 id={articleTitleId} className="text-headline font-semibold text-text-primary">
            {article.title}
          </h3>
          <blockquote className="border-l-2 border-accent-gold pl-3 text-callout text-text-secondary">
            {keyQuote(article)}
          </blockquote>
          <div className="flex items-center gap-2.5">
            <PlayerAvatar photoUrl={article.author.photoUrl} name={article.author.name} fallback="initials" size="sm" decorative />
            <p className="min-w-0 text-footnote text-text-secondary">
              <span className="font-semibold text-text-primary">{article.author.name}</span>
              <span aria-hidden="true"> · </span>
              <time dateTime={article.publishedAt}>{publishedAgo(article.publishedAt, nowMs)}</time>
            </p>
          </div>
          <a
            href={article.url}
            className="inline-flex min-h-10 w-fit items-center gap-1 rounded-pill text-subhead font-semibold text-link hover:underline"
          >
            Read full article
            <span className="sr-only">: {article.title}</span>
            <Icon name="arrow-up-right" size={16} />
          </a>
        </article>
      )}
    </Card>
  );
}

export function ArticleExcerptSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status">
      <span className="sr-only">Loading article</span>
      <Skeleton variant="rect" className="aspect-video w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
