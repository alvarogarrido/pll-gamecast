import type { PlayerRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { playerInitials, playerMeta, playerShortName } from '../../lib/format';
import { PlayerAvatar, type PlayerAvatarFallback, type PlayerAvatarSize } from '../../atoms/PlayerAvatar';

export type PlayerIdentityLayout = 'inline' | 'stacked';
export type PlayerIdentitySide = 'away' | 'home';
export type PlayerIdentitySize = 'sm' | 'md' | 'lg';

export interface PlayerIdentityProps {
  player: PlayerRef;
  /** Team color for the avatar ring (`team.colors.primary`); `PlayerRef` only carries a `teamId`. */
  teamColor?: string;
  /** `inline` = avatar beside the text, `stacked` = avatar above (top performers). Default `inline`. */
  layout?: PlayerIdentityLayout;
  /** Mirrors `inline` for the home side: avatar on the right, text right-aligned. Default `away`. */
  side?: PlayerIdentitySide;
  size?: PlayerIdentitySize;
  /** Show the "#11 · A · Jr" line. Default true. */
  showMeta?: boolean;
  /** Replace the meta line (e.g. "2A, 5PTS" for a stat line). */
  meta?: string;
  avatarFallback?: PlayerAvatarFallback;
  className?: string;
}

const avatarSize: Record<PlayerIdentitySize, Record<PlayerIdentityLayout, PlayerAvatarSize>> = {
  sm: { inline: 'sm', stacked: 'md' },
  md: { inline: 'md', stacked: 'lg' },
  lg: { inline: 'lg', stacked: 'lg' },
};

const nameText: Record<PlayerIdentitySize, string> = {
  sm: 'text-footnote',
  md: 'text-subhead',
  lg: 'text-headline',
};

/**
 * Avatar + short name ("B. Dowd") + "#11 · A · Jr". Mirror it for the home side with `side="home"`.
 * The avatar is decorative: the name next to it is the accessible label.
 */
export function PlayerIdentity({
  player,
  teamColor,
  layout = 'inline',
  side = 'away',
  size = 'md',
  showMeta = true,
  meta,
  avatarFallback,
  className,
}: PlayerIdentityProps) {
  const stacked = layout === 'stacked';
  const mirrored = side === 'home';
  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <div
      data-side={side}
      data-layout={layout}
      className={cn(
        'flex min-w-0 gap-2.5',
        stacked ? 'flex-col items-center text-center' : mirrored ? 'flex-row-reverse items-center text-right' : 'items-center text-left',
        className,
      )}
    >
      <PlayerAvatar
        photoUrl={player.photoUrl}
        name={fullName}
        initials={playerInitials(player)}
        color={teamColor}
        size={avatarSize[size][layout]}
        fallback={avatarFallback}
        decorative
      />
      <div className="flex min-w-0 flex-col">
        <span title={fullName} className={cn('truncate font-semibold text-text-primary', nameText[size])}>
          {playerShortName(player)}
        </span>
        {showMeta && <span className="truncate text-caption text-text-secondary">{meta ?? playerMeta(player)}</span>}
      </div>
    </div>
  );
}
