import { relativeTimeLabel } from '../../lib/format';
import type { GameMedia } from '@pll/data/api';

export type ArticleWithAuthor = GameMedia['data']['articles'][number];
export type ArticleKind = 'preview' | 'recap';

/**
 * Alias of {@link relativeTimeLabel} (`lib/format.ts`), kept so existing imports keep working.
 * @deprecated Use `relativeTimeLabel`.
 */
export function publishedAgo(iso: string, nowMs: number): string {
  return relativeTimeLabel(iso, nowMs);
}

const newest = (a: ArticleWithAuthor, b: ArticleWithAuthor) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

/** The article to feature: the newest of the wanted kind, or `null` (no preview published yet, say). */
export function featuredArticle(articles: readonly ArticleWithAuthor[], kind: ArticleKind): ArticleWithAuthor | null {
  return [...articles].filter((a) => a.kind === kind).sort(newest)[0] ?? null;
}

/** Everything except the featured article, newest first, for the carousel. */
export function otherArticles(articles: readonly ArticleWithAuthor[], featured: ArticleWithAuthor | null): ArticleWithAuthor[] {
  return [...articles].filter((a) => a.id !== featured?.id).sort(newest);
}

const MIN_QUOTE_LENGTH = 25;
const MAX_QUOTE_LENGTH = 180;

/**
 * The pull quote. Uses `keySentence`; when that is clearly cut off (the simulated data truncates at "No." in
 * "No. 7 Yale...") it falls back to the first whole sentence of the excerpt that is long enough, trimmed to a length.
 */
export function keyQuote(article: Pick<ArticleWithAuthor, 'keySentence' | 'excerpt'>): string {
  const key = article.keySentence.trim();
  if (key.length >= MIN_QUOTE_LENGTH) return key;
  // Split on sentence ends but not after rank abbreviations like "No.".
  const sentences = article.excerpt.split(/(?<!\bNo\.)(?<=[.!?])\s+/).map((s) => s.trim());
  const sentence = sentences.find((s) => s.length >= MIN_QUOTE_LENGTH) ?? article.excerpt.trim();
  if (sentence.length <= MAX_QUOTE_LENGTH) return sentence;
  return `${sentence.slice(0, MAX_QUOTE_LENGTH).replace(/\s+\S*$/, '')}…`;
}
