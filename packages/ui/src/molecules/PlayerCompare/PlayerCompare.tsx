import type { PlayerRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Chip } from '../../atoms/Chip';
import { PlayerIdentity, type PlayerIdentitySide } from '../PlayerIdentity';

/** One player of a head-to-head: who, the big number and the small supporting stats. */
export interface PlayerCompareEntry {
  player: PlayerRef;
  /** Team primary color for the avatar ring (`team.colors.primary`). */
  teamColor?: string;
  /** The big number and its label: `{ value: '6', label: 'Goals' }`. Already formatted. */
  primary: { value: string; label: string };
  /** Small supporting stats under the player, already formatted: `["3/7 SH", "2 A", "5 PTS"]`. */
  secondary?: readonly string[];
}

export interface PlayerCompareProps {
  /** Category chip in the middle ("Scoring", "Goalie", "Faceoff"). Also names the group for screen readers. */
  title: string;
  /** Away player (left). `null` shows `emptyLabel` on that side. */
  away: PlayerCompareEntry | null;
  /** Home player (right, mirrored). */
  home: PlayerCompareEntry | null;
  /** Shown on a side with no player. Default "No data". */
  emptyLabel?: string;
  /** Team names for the group's accessible label ("Scoring: Duke versus Notre Dame"). */
  awayName: string;
  homeName: string;
  /** Override the avatar ring colors, e.g. both halves of `teamPairColors(...)` so the teams cannot look alike. */
  teamColors?: { away?: string; home?: string };
  className?: string;
}

function CompareSide({
  side,
  entry,
  color,
  emptyLabel,
}: {
  side: PlayerIdentitySide;
  entry: PlayerCompareEntry | null;
  color?: string;
  emptyLabel: string;
}) {
  if (!entry) {
    return (
      <div data-side={side} className="flex min-h-20 items-center justify-center text-center">
        <p className="text-footnote text-text-tertiary">{emptyLabel}</p>
      </div>
    );
  }
  const secondary = entry.secondary ?? [];
  return (
    <div data-side={side} className="flex min-w-0 flex-col items-center gap-1">
      <PlayerIdentity
        player={entry.player}
        teamColor={color ?? entry.teamColor}
        layout="stacked"
        side={side}
        className="w-full"
        trailing={
          <div className="flex flex-col items-center pt-1">
            <span className="font-display text-score tabular-nums text-text-primary">{entry.primary.value}</span>
            <span className="text-caption text-text-secondary">{entry.primary.label}</span>
          </div>
        }
      />
      {secondary.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-x-2 text-caption tabular-nums text-text-secondary">
          {secondary.map((item) => (
            <li key={item} className="whitespace-nowrap">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One head-to-head (Figma "Block/PlayerCompare"): the away player on the left, the category chip in the middle, the home
 * player on the right (mirrored). Each side is a stacked `PlayerIdentity` with the big stat beside it and the supporting
 * stats under it. Stack several in a card for Top Performers / Players to Watch.
 */
export function PlayerCompare({ title, away, home, emptyLabel = 'No data', awayName, homeName, teamColors, className }: PlayerCompareProps) {
  return (
    <div role="group" aria-label={`${title}: ${awayName} versus ${homeName}`} className={cn('grid grid-cols-[1fr_auto_1fr] gap-x-2', className)}>
      <CompareSide side="away" entry={away} color={teamColors?.away} emptyLabel={emptyLabel} />
      {/* The chip lines up with the avatar row (h-16 avatar, centered), not with the whole block. */}
      <h3 className="flex h-16 items-center">
        <Chip tone="neutral" size="sm" className="text-footnote font-semibold text-text-primary">
          {title}
        </Chip>
      </h3>
      <CompareSide side="home" entry={home} color={teamColors?.home} emptyLabel={emptyLabel} />
    </div>
  );
}
