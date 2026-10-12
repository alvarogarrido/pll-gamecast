'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@pll/icons';
import { Chip } from '../../atoms/Chip';
import { MediaImage } from '../../atoms/MediaImage';
import { Skeleton } from '../../atoms/Skeleton';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';
import { durationLabel, shouldAutoplay, type VideoItem } from './video.logic';

export interface VideoPlayerProps {
  /** One entry of `GameMedia['data']['videos']`. `null` shows an empty frame. */
  video: VideoItem | null;
  /** Recommended next video, offered as "Up next" when this one ends. */
  nextVideo?: VideoItem | null;
  /** Autoplay muted (the pregame preview, per the PRD). Ignored under `prefers-reduced-motion`. */
  autoplay?: boolean;
  /** Called when the viewer picks "Play next" on the end screen. */
  onSelectNext?: (video: VideoItem) => void;
  /** Section title above the player ("Game preview"). Omit when a parent supplies the heading. */
  heading?: string;
  /** Wrap in a bordered card (default). Turn off when a parent card already frames it. */
  framed?: boolean;
  loading?: boolean;
  className?: string;
}

/** Reads `prefers-reduced-motion` after mount (false on the server, so markup matches). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function Player({ video, nextVideo, autoplay, onSelectNext }: { video: VideoItem } & Pick<VideoPlayerProps, 'nextVideo' | 'autoplay' | 'onSelectNext'>) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const willAutoplay = shouldAutoplay(!!autoplay, reduced);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterOk, setPosterOk] = useState(true);

  // A poster that 404s would leave a blank frame: probe it and drop it, so the placeholder shows instead.
  useEffect(() => {
    if (!video.thumbnailUrl || typeof Image === 'undefined') return;
    const probe = new Image();
    probe.onerror = () => setPosterOk(false);
    probe.src = video.thumbnailUrl;
  }, [video.thumbnailUrl]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !willAutoplay) return;
    el.muted = true; // browsers only allow autoplay when muted
    el.play().catch(() => {
      /* blocked by the browser: the controls are right there */
    });
  }, [willAutoplay, video.id]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-surface-raised">
      {!posterOk && (
        <div className="absolute inset-0" aria-hidden="true">
          <MediaImage src={null} placeholderIcon="highlights" className="size-full rounded-none" />
        </div>
      )}
      <video
        ref={ref}
        src={video.src}
        poster={posterOk ? video.thumbnailUrl : undefined}
        controls
        playsInline
        muted={willAutoplay}
        preload="metadata"
        aria-label={video.title}
        onPlay={() => setEnded(false)}
        onEnded={() => setEnded(true)}
        onError={() => setFailed(true)}
        className="relative size-full bg-transparent object-contain"
      />
      {failed && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-card p-4 text-center">
          <Icon name="circle-error" size={24} className="text-status-negative" />
          <p className="text-subhead font-semibold text-text-primary">This video can't be played</p>
          <p className="text-footnote text-text-secondary">Check your connection and try again.</p>
        </div>
      )}
      {ended && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-page/90 p-4 text-center" role="group" aria-label="Video ended">
          {nextVideo && onSelectNext ? (
            <>
              <p className="text-caption font-semibold uppercase text-text-secondary">Up next</p>
              <button
                type="button"
                onClick={() => onSelectNext(nextVideo)}
                className="flex max-w-full items-center gap-3 rounded-sm bg-surface-card p-2 text-left hover:bg-surface-raised"
              >
                <MediaImage src={nextVideo.thumbnailUrl} placeholderIcon="highlights" className="w-24 shrink-0" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="line-clamp-2 text-footnote font-semibold text-text-primary">{nextVideo.title}</span>
                  <span className="text-caption text-text-secondary">{durationLabel(nextVideo.durationSeconds)}</span>
                </span>
                <Icon name="play-filled" size={24} className="shrink-0 text-accent-gold" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEnded(false);
              void ref.current?.play();
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-pill bg-surface-chip px-4 text-footnote font-semibold text-text-primary hover:bg-surface-selected"
          >
            Replay
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Video player: a native `<video>` with poster, controls, title and duration. With `autoplay` it starts muted, unless the
 * viewer prefers reduced motion. When the video ends it offers "Up next" (the `nextVideo`) and Replay.
 * Changing `video` loads the new one (state resets, and autoplay applies again).
 */
export function VideoPlayer({ video, nextVideo = null, autoplay = false, onSelectNext, heading, framed = true, loading = false, className }: VideoPlayerProps) {
  return (
    <section
      aria-label={heading ?? 'Video player'}
      aria-busy={loading || undefined}
      className={cn(
        'flex flex-col gap-3',
        framed && 'rounded-md border border-border-default bg-surface-card p-4 text-text-primary',
        className,
      )}
    >
      {heading && <SectionHeader title={heading} />}
      {loading ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading video</span>
          <Skeleton variant="rect" className="aspect-video w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : !video ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-sm bg-surface-card text-footnote text-text-tertiary">
          No video available yet.
        </div>
      ) : (
        <>
          <Player key={video.id} video={video} nextVideo={nextVideo} autoplay={autoplay} onSelectNext={onSelectNext} />
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-headline font-semibold text-text-primary">{video.title}</h3>
            <Chip size="sm" className="mt-0.5">
              <span className="sr-only">Duration </span>
              {durationLabel(video.durationSeconds)}
            </Chip>
          </div>
        </>
      )}
    </section>
  );
}
