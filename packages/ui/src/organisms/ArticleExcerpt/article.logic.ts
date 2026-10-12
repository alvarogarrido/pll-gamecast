import { dateLabel } from '../../lib/format';
import type { GameMedia } from '@pll/data/api';

export type ArticleWithAuthor = GameMedia['data']['articles'][number];
export type ArticleKind = 'preview' | 'recap';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * "just now", "5m ago", "3h ago", "2d ago", and the date (`Mar 13`) after a week. `nowMs` is server time. Timestamps in
 * the future (clock skew) read "just now"; an unparseable one reads as an empty string.
 */
export function publishedAgo(iso: string, nowMs: number): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const age = nowMs - ms;
  if (age < MIN) return 'just now';
  if (age < HOUR) return `${Math.floor(age / MIN)}m ago`;
  if (age < DAY) return `${Math.floor(age / HOUR)}h ago`;
  if (age < 7 * DAY) return `${Math.floor(age / DAY)}d ago`;
  return dateLabel(iso);
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
