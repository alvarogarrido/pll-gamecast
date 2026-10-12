import { describe, expect, it } from 'vitest';
import { durationLabel, nextVideo, orderVideos, previewVideo, shouldAutoplay, type VideoItem } from './video.logic';

const v = (id: string, kind: VideoItem['kind'], publishedAt: string): VideoItem =>
  ({ id, kind, publishedAt, title: id, thumbnailUrl: '', src: '', durationSeconds: 90, gameId: 'g' }) as VideoItem;

const list = [v('pre', 'preview', '2027-03-01T00:00:00Z'), v('post', 'postgame', '2027-03-02T00:00:00Z'), v('h1', 'highlight', '2027-03-02T00:00:00Z'), v('h2', 'highlight', '2027-03-03T00:00:00Z'), v('o', 'other', '2027-03-05T00:00:00Z')];

describe('orderVideos', () => {
  it('puts highlights first (newest first), the preview last', () => {
    expect(orderVideos(list).map((x) => x.id)).toEqual(['h2', 'h1', 'post', 'o', 'pre']);
  });
});

describe('previewVideo / nextVideo', () => {
  it('finds the preview', () => {
    expect(previewVideo(list)?.id).toBe('pre');
    expect(previewVideo([v('h', 'highlight', '2027-03-01T00:00:00Z')])).toBeNull();
  });
  it('recommends the following video', () => {
    const ordered = orderVideos(list); // h2, h1, post, o, pre
    expect(nextVideo(ordered, 'post')?.id).toBe('o');
    expect(nextVideo(ordered, 'h2')?.id).toBe('h1');
    expect(nextVideo(ordered, 'pre')).toBeNull();
    expect(nextVideo(ordered, 'unknown')).toBeNull();
  });
});

describe('autoplay and duration', () => {
  it('never autoplays under reduced motion', () => {
    expect(shouldAutoplay(true, true)).toBe(false);
    expect(shouldAutoplay(true, false)).toBe(true);
    expect(shouldAutoplay(false, false)).toBe(false);
  });
  it('formats durations', () => {
    expect(durationLabel(128)).toBe('2:08');
    expect(durationLabel(NaN)).toBe('–');
  });
});
