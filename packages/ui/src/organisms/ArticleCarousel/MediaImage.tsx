'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@pll/icons';
import { cn } from '../../lib/cn';

export interface MediaImageProps {
  /** Image URL. `null`, empty or a URL that fails to load renders the placeholder. */
  src: string | null;
  /** Describe the image, or leave empty when it is decorative (the usual case next to a title). */
  alt?: string;
  /** Icon in the placeholder. Default `lacrosse-field`. */
  placeholderIcon?: IconName;
  className?: string;
}

/**
 * PRIVATE building block of the media organisms (articles, videos): a 16:9 image that falls back to a neutral
 * placeholder tile. Probably belongs in the shared atoms.
 */
export function MediaImage({ src, alt = '', placeholderIcon = 'lacrosse-field', className }: MediaImageProps) {
  // Remember which URL failed, so a new `src` gets a fresh attempt without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-sm bg-surface-raised', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(src)}
          ref={(img) => {
            if (img && img.complete && img.naturalWidth === 0) setFailedSrc(src);
          }}
          className="size-full object-cover"
        />
      ) : (
        <span data-placeholder="" aria-hidden="true" className="flex size-full items-center justify-center text-text-disabled">
          <Icon name={placeholderIcon} size={32} />
        </span>
      )}
    </div>
  );
}
