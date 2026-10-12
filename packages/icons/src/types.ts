import type { ComponentPropsWithoutRef, ComponentType } from 'react';

export type IconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'children'> & {
  /** Rendered width and height in px (or any CSS length). Default 24. */
  size?: number | string;
  /**
   * Accessible name. When set the SVG gets `role="img"` and a `<title>`;
   * otherwise it is decorative (`aria-hidden="true"`).
   */
  title?: string;
};

export type IconComponent = ComponentType<IconProps>;
