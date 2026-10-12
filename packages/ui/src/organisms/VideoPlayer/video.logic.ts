import type { GameMedia } from '@pll/data/api';
import { clock } from '../../lib/format';

export type VideoItem = GameMedia['data']['videos'][number];

const kindOrder: Record<VideoItem['kind'], number> = { highlight: 0, postgame: 1, other: 2, preview: 3 };
const newest = (a: VideoItem, b: VideoItem) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

/** Highlights first, then postgame, other and the preview last; newest first inside each kind. Does not mutate. */
export function orderVideos(videos: readonly VideoItem[]): VideoItem[] {
  return [...videos].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || newest(a, b));
}

/** The pregame preview video: the newest one of kind `preview`, or `null`. */
export function previewVideo(videos: readonly VideoItem[]): VideoItem | null {
  return [...videos].filter((v) => v.kind === 'preview').sort(newest)[0] ?? null;
}

/** The video recommended after `currentId`: the next one in `videos` order; `null` after the last or when unknown. */
export function nextVideo(videos: readonly VideoItem[], currentId: string): VideoItem | null {
  const index = videos.findIndex((v) => v.id === currentId);
  return index === -1 ? null : (videos[index + 1] ?? null);
}

/** `"2:08"`. Zero or unknown lengths read as an en dash (see `clock`). */
export const durationLabel = (seconds: number | null | undefined): string => clock(seconds);

/** Autoplay is a request, never a right: users who prefer reduced motion get a paused video. */
export const shouldAutoplay = (autoplay: boolean, prefersReducedMotion: boolean): boolean => autoplay && !prefersReducedMotion;
