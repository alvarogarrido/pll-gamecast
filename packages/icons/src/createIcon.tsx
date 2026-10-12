import { useId, type ReactNode } from 'react';
import type { IconComponent, IconProps } from './types';

/**
 * Wraps generated SVG children in the shared <svg> shell.
 * Glyph paths inherit `currentColor`, so icons follow the surrounding text colour.
 */
export function createIcon(displayName: string, children: ReactNode): IconComponent {
  function Icon({ size = 24, title, ...rest }: IconProps) {
    const titleId = useId();
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width={size}
        height={size}
        focusable="false"
        {...(title
          ? { role: 'img', 'aria-labelledby': titleId }
          : { 'aria-hidden': true })}
        {...rest}
      >
        {title ? <title id={titleId}>{title}</title> : null}
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}
