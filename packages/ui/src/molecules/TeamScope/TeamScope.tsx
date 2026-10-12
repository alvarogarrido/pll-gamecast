import type { ComponentPropsWithoutRef, ElementType } from 'react';
import type { TeamRef } from '@pll/data/api';
import { teamColorVars } from '../../lib/team-style';

export interface TeamScopeProps extends ComponentPropsWithoutRef<'div'> {
  /** Team whose colors apply inside. Only `colors` is read, so any object with it works. */
  team: Pick<TeamRef, 'colors'>;
  /** Rendered element. Defaults to `div`. */
  as?: ElementType;
  /**
   * The on-dark color to use for this team (`bg-team-primary-on-dark`...). Defaults to the primary lightened to 3:1 on the
   * card. Pass one half of `teamPairColors(away, home)` so the two teams of a game cannot look alike.
   */
  primaryOnDark?: string;
}

/**
 * Sets `--team-primary` / `--team-secondary` for its subtree, so `bg-team-primary`, `text-team-secondary`,
 * `border-team-primary`... resolve to this team. It also sets `--team-primary-on-dark`: on dark surfaces (cards, the page)
 * draw with `bg-team-primary-on-dark` / `border-team-primary-on-dark`, the primary lightened until it stays visible.
 * Scopes nest; the closest one wins.
 */
export function TeamScope({ team, as: Component = 'div', primaryOnDark, style, ...rest }: TeamScopeProps) {
  return <Component style={{ ...teamColorVars(team.colors.primary, team.colors.secondary, primaryOnDark), ...style }} {...rest} />;
}
