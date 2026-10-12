import type { CSSProperties } from 'react';

/**
 * Inline style that makes `bg-team-primary` / `text-team-secondary` / `border-team-primary`... resolve to a team's colors
 * for the element and its subtree. Pass `team.colors.primary` (and `.secondary`) from the API.
 * Undefined colors are skipped so the neutral token fallback applies.
 */
export function teamColorVars(primary?: string | null, secondary?: string | null): CSSProperties {
  const vars: Record<string, string> = {};
  if (primary) vars['--team-primary'] = primary;
  if (secondary) vars['--team-secondary'] = secondary;
  return vars as CSSProperties;
}
