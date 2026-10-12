'use client';

import { useState, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export type TeamLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TeamLogoProps {
  /** Logo URL. `null` (or a URL that fails to load) renders the monogram fallback. */
  src: string | null;
  /** Team name, used as the accessible name. */
  name: string;
  /** Short code for the fallback monogram, e.g. "DUKE". Falls back to the name's initials. */
  abbreviation?: string;
  size?: TeamLogoSize;
  /**
   * Team color (e.g. `team.colors.primary`), shown as the monogram's ring. Set as the `--team-primary` runtime
   * variable on the element, so it reads through the `border-team-primary` utility.
   */
  color?: string;
  /** Hide from assistive tech when the team name is already written next to the logo. */
  decorative?: boolean;
  className?: string;
}

const boxes: Record<TeamLogoSize, string> = {
  xs: 'size-5',
  sm: 'size-7',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
};

const monogramText: Record<TeamLogoSize, string> = {
  xs: 'text-caption2 font-semibold',
  sm: 'text-caption2 font-semibold',
  md: 'text-caption font-semibold',
  lg: 'text-title3',
  xl: 'text-score',
};

const maxChars: Record<TeamLogoSize, number> = { xs: 2, sm: 3, md: 4, lg: 4, xl: 4 };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('');
}

export function TeamLogo({
  src,
  name,
  abbreviation,
  size = 'md',
  color,
  decorative = false,
  className,
}: TeamLogoProps) {
  // Remember which URL failed, so a new `src` gets a fresh attempt without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== '' && failedSrc !== src;
  const a11y = decorative ? { 'aria-hidden': true as const } : {};

  if (showImage) {
    return (
      <img
        src={src}
        alt={decorative ? '' : name}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailedSrc(src)}
        ref={(img) => {
          // The image may have failed before React attached the handler (SSR / cached 404).
          if (img && img.complete && img.naturalWidth === 0) setFailedSrc(src);
        }}
        className={cn('shrink-0 object-contain', boxes[size], className)}
      />
    );
  }

  const text = (abbreviation ?? initials(name)).slice(0, maxChars[size]).toUpperCase();
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      {...a11y}
      style={color ? ({ '--team-primary': color } as CSSProperties) : undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full border-2 bg-surface-raised tracking-tight text-text-primary',
        color ? 'border-team-primary' : 'border-border-default',
        boxes[size],
        monogramText[size],
        className,
      )}
    >
      {text}
    </span>
  );
}
