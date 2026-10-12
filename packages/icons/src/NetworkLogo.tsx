import { useId } from 'react';
import {
  networkLabels,
  networkLogos,
  type NetworkId,
  type NetworkVariant,
} from './generated/networkLogos';
import type { IconProps } from './types';

export type NetworkLogoProps = Omit<IconProps, 'size' | 'height' | 'width'> & {
  network: NetworkId;
  /** `white` = for dark/saturated surfaces, `color` = brand colours. Default `color`. */
  variant?: NetworkVariant;
  /** Rendered height in px; the width follows the logo's real aspect ratio. Default 16. */
  height?: number;
};

/**
 * Broadcast network logo. Colours are baked in (no currentColor) and the
 * aspect ratio of the Figma artwork is preserved.
 */
export function NetworkLogo({ network, variant = 'color', height = 16, title, ...rest }: NetworkLogoProps) {
  const titleId = useId();
  const logo = networkLogos[network][variant];
  const width = Math.round((height * logo.width * 100) / logo.height) / 100;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={logo.viewBox}
      fill="none"
      width={width}
      height={height}
      focusable="false"
      data-network={network}
      data-variant={variant}
      {...(title
        ? { role: 'img', 'aria-labelledby': titleId }
        : { 'aria-hidden': true })}
      {...rest}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {logo.children}
    </svg>
  );
}

export { networkLabels };
