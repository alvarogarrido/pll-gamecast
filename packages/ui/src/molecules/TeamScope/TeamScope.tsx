import type { ComponentPropsWithoutRef, ElementType } from 'react';
import type { TeamRef } from '@pll/data/api';
import { teamColorVars } from '../../lib/team-style';

export interface TeamScopeProps extends ComponentPropsWithoutRef<'div'> {
  /** Team whose colors apply inside. Only `colors` is read, so any object with it works. */
  team: Pick<TeamRef, 'colors'>;
  /** Rendered element. Defaults to `div`. */
  as?: ElementType;
}

/**
 * Sets `--team-primary` / `--team-secondary` for its subtree, so `bg-team-primary`, `text-team-secondary`,
 * `border-team-primary`... resolve to this team. Scopes nest; the closest one wins.
 */
export function TeamScope({ team, as: Component = 'div', style, ...rest }: TeamScopeProps) {
  return <Component style={{ ...teamColorVars(team.colors.primary, team.colors.secondary), ...style }} {...rest} />;
}
