'use client';

import { useState } from 'react';
import { cn } from '../../lib/cn';
import { teamColorVars } from '../../lib/team-style';

export type PlayerAvatarSize = 'sm' | 'md' | 'lg';
export type PlayerAvatarFallback = 'silhouette' | 'initials';

export interface PlayerAvatarProps {
  /** Photo URL. `null` (or a URL that fails to load) renders the fallback. */
  photoUrl: string | null;
  /** Player name: the accessible name, and the source of the initials. */
  name: string;
  /** Team color (e.g. `team.colors.primary`). Rings the avatar through `--team-primary`; omit to use the neutral border. */
  color?: string;
  size?: PlayerAvatarSize;
  /** What to draw without a photo: a head-and-shoulders `silhouette` (default) or the `initials`. */
  fallback?: PlayerAvatarFallback;
  /** Explicit initials ("BD"). Defaults to the first letters of `name`. */
  initials?: string;
  /** Hide from assistive tech when the name is written next to the avatar (the usual case). */
  decorative?: boolean;
  className?: string;
}

const boxes: Record<PlayerAvatarSize, string> = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

const initialsText: Record<PlayerAvatarSize, string> = {
  sm: 'text-caption2 font-semibold',
  md: 'text-footnote font-semibold',
  lg: 'text-headline',
};

const maxInitials = 2;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, maxInitials)
    .toUpperCase();
}

function Silhouette() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-full text-text-tertiary" fill="currentColor">
      <circle cx="12" cy="9" r="4" />
      <path d="M3.5 24a8.5 8.5 0 0 1 17 0z" />
    </svg>
  );
}

/**
 * Player headshot in a circle ringed with the team color. Without a photo (all of them in the demo data, or a failed
 * load) it shows a silhouette or the initials. Pair with the player's name in text, then pass `decorative`.
 */
export function PlayerAvatar({
  photoUrl,
  name,
  color,
  size = 'md',
  fallback = 'silhouette',
  initials,
  decorative = false,
  className,
}: PlayerAvatarProps) {
  // Remember which URL failed, so a new `photoUrl` gets a fresh attempt without an effect.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!photoUrl && failedUrl !== photoUrl;
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': name };

  return (
    <span
      {...a11y}
      style={teamColorVars(color)}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border-2 bg-surface-raised',
        color ? 'border-team-primary' : 'border-border-default',
        boxes[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedUrl(photoUrl)}
          ref={(img) => {
            // The image may have failed before React attached the handler (SSR / cached 404).
            if (img && img.complete && img.naturalWidth === 0) setFailedUrl(photoUrl);
          }}
          className="size-full object-cover"
        />
      ) : fallback === 'initials' ? (
        <span aria-hidden="true" className={cn('text-text-secondary', initialsText[size])}>
          {(initials ?? initialsOf(name)).slice(0, maxInitials).toUpperCase()}
        </span>
      ) : (
        <Silhouette />
      )}
    </span>
  );
}
