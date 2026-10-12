import { describe, expect, it } from 'vitest';
import { relativeTimeLabel } from '../../lib/format';
import { featuredArticle, keyQuote, otherArticles, publishedAgo, type ArticleWithAuthor } from './article.logic';

const NOW = Date.parse('2027-03-13T12:00:00Z');
const article = (id: string, kind: ArticleWithAuthor['kind'], publishedAt: string): ArticleWithAuthor =>
  ({ id, kind, publishedAt, title: id, keySentence: '', excerpt: '', author: { id: 'a', name: 'A', photoUrl: null, title: null } }) as unknown as ArticleWithAuthor;

describe('publishedAgo (alias of relativeTimeLabel)', () => {
  it('is the same function result', () => {
    for (const iso of ['2027-03-13T11:30:00Z', '2027-03-01T12:00:00Z', 'nope']) expect(publishedAgo(iso, NOW)).toBe(relativeTimeLabel(iso, NOW));
  });
  it('uses coarse relative units from server time', () => {
    expect(publishedAgo('2027-03-13T11:59:50Z', NOW)).toBe('just now');
    expect(publishedAgo('2027-03-13T11:30:00Z', NOW)).toBe('30m ago');
    expect(publishedAgo('2027-03-13T09:00:00Z', NOW)).toBe('3h ago');
    expect(publishedAgo('2027-03-11T12:00:00Z', NOW)).toBe('2d ago');
  });
  it('falls back to a date after a week, and tolerates future and bad input', () => {
    expect(publishedAgo('2027-03-01T12:00:00Z', NOW)).toBe('Mar 1');
    expect(publishedAgo('2027-03-14T12:00:00Z', NOW)).toBe('just now');
    expect(publishedAgo('nope', NOW)).toBe('');
  });
});

describe('featuredArticle / otherArticles', () => {
  const list = [article('p-old', 'preview', '2027-03-01T00:00:00Z'), article('p-new', 'preview', '2027-03-10T00:00:00Z'), article('n', 'news', '2027-03-12T00:00:00Z')];
  it('features the newest of the kind', () => {
    expect(featuredArticle(list, 'preview')?.id).toBe('p-new');
    expect(featuredArticle(list, 'recap')).toBeNull();
  });
  it('lists the rest newest first', () => {
    expect(otherArticles(list, featuredArticle(list, 'preview')).map((a) => a.id)).toEqual(['n', 'p-old']);
  });
});

describe('keyQuote', () => {
  it('keeps a proper key sentence', () => {
    expect(keyQuote({ keySentence: "Princeton wins a tight one at home tonight.", excerpt: '' })).toBe('Princeton wins a tight one at home tonight.');
  });
  it('recovers from a truncated key sentence without splitting on "No."', () => {
    const q = keyQuote({ keySentence: 'No', excerpt: 'No. 7 Yale visits No. 10 Princeton in a matchup of ranked teams. The Ivy standings are in play.' });
    expect(q).toBe('No. 7 Yale visits No. 10 Princeton in a matchup of ranked teams.');
  });
  it('trims a very long fallback', () => {
    const q = keyQuote({ keySentence: '', excerpt: `${'word '.repeat(80)}end.` });
    expect(q.length).toBeLessThanOrEqual(181);
    expect(q.endsWith('…')).toBe(true);
  });
});
