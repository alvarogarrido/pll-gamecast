import type { GameSummary, Play, PlayerRef, TeamRef } from '@pll/data/api';
import { Icon } from '@pll/icons';
import { cn } from '../../lib/cn';
import { clock, periodLabel, playerLabel } from '../../lib/format';
import { teamColorVars, teamPairColors } from '../../lib/team-style';
import { ScoreChip } from '../../atoms/ScoreChip';
import { TeamLogo } from '../../atoms/TeamLogo';
import { PlayerIdentity } from '../../molecules/PlayerIdentity';
import { dividerLabel, playDetail, playKind, playLabel, playerMap } from './playByPlay.logic';

/** The slice of a game the play rows need (a `GameDetail['data']` or `GameSummary` fits). */
export type PlayGame = Pick<GameSummary, 'home' | 'away'> & Partial<Pick<GameSummary, 'status'>>;

export type PlayRowDensity = 'card' | 'flat';

export interface PlayRowProps {
  play: Play;
  game: PlayGame;
  /** `playerRefs` of the plays response (array or an id map). */
  playerRefs: readonly PlayerRef[] | ReadonlyMap<string, PlayerRef>;
  /**
   * `card` (default): own surface and border, used in the Play-by-Play tab.
   * `flat`: no surface, a hairline divider, for use inside another card (Latest Plays).
   */
  density?: PlayRowDensity;
  className?: string;
}

function teamOf(game: PlayGame, teamId: string | null): { team: TeamRef; side: 'away' | 'home' } | null {
  if (teamId === game.home.team.id) return { team: game.home.team, side: 'home' };
  if (teamId === game.away.team.id) return { team: game.away.team, side: 'away' };
  return null;
}

const clockLabel = (play: Play) => `${periodLabel(play.period)} ${clock(play.clockSeconds)}`;

/** Small separator for period starts/ends and timeouts ("All" view only). */
function Divider({ play, game, className }: { play: Play; game: PlayGame; className?: string }) {
  const t = teamOf(game, play.teamId);
  return (
    <li
      data-kind="divider"
      className={cn('flex items-center gap-2 px-1 py-0.5 text-caption text-text-tertiary', className)}
    >
      <span aria-hidden="true" className="h-px flex-1 bg-border-hairline" />
      <span className="shrink-0 tabular-nums">
        {dividerLabel(play, t?.team.abbreviation)}
        <span className="sr-only">, </span>
        <span className="ml-1 font-display">{clock(play.clockSeconds)}</span>
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-border-hairline" />
    </li>
  );
}

/**
 * One play. Three looks, chosen from the play type:
 *  - goal: the strong "Recent Play / Goal" card (clock chip, title, running score, scorer and assist),
 *  - micro: every other game action, ONE ~40px line (D8): team logo, play type, "J. Smith (#11)", detail, clock. No avatar.
 *    On narrow rows the detail drops out visually (kept for screen readers and in the `title` tooltip). In the `card`
 *    density the period is omitted from the clock because the row sits inside its period's accordion.
 *  - divider: period start/end and timeouts as a hairline caption.
 * The row is a `<li>`: render it inside a `<ul>`/`<ol>`.
 */
export function PlayRow({ play, game, playerRefs, density = 'card', className }: PlayRowProps) {
  const kind = playKind(play);
  if (kind === 'divider') return <Divider play={play} game={game} className={className} />;

  const players = playerMap(playerRefs);
  const scope = teamOf(game, play.teamId);
  // On-dark color of the scoring/acting team, picked as a pair so look-alike teams (Duke / Notre Dame) stay apart.
  const teamColor = scope ? teamPairColors(game.away.team.colors, game.home.team.colors)[scope.side] : undefined;
  const player = play.playerId ? players.get(play.playerId) : undefined;
  const detail = playDetail(play, players);
  const label = playLabel(play);
  const isGoal = kind === 'goal';
  const flat = density === 'flat';

  const shell = flat
    ? 'border-b border-border-hairline px-4 py-3 last:border-b-0'
    : cn('overflow-hidden rounded-md border bg-surface-card', isGoal ? 'border-accent-gold/40' : 'border-border-hairline');

  const logo = scope ? (
    <TeamLogo
      src={scope.team.logoUrl}
      name={`${scope.team.school} ${scope.team.mascot}`}
      abbreviation={scope.team.abbreviation}
      color={teamColor}
      size="xs"
    />
  ) : null;

  const who = player ? (
    <PlayerIdentity player={player} teamColor={teamColor} size="sm" showMeta meta={detail || undefined} />
  ) : (
    // No player on the play, or the player is missing from `playerRefs`: fall back to the server text.
    <p className="text-footnote text-text-secondary">{play.description}</p>
  );

  if (isGoal) {
    return (
      <li data-kind="goal" data-side={scope?.side} style={teamColorVars(scope?.team.colors.primary, null, teamColor)} className={cn(shell, className)}>
        <div className={cn('flex items-center gap-2 py-2', flat ? 'px-0' : 'px-3')}>
          {logo}
          <Icon name="goal" size={20} className="shrink-0 text-accent-gold" />
          <span className="min-w-0 flex-1 truncate text-headline text-text-primary">{label}</span>
          <ScoreChip away={play.awayScore} home={play.homeScore} emphasis={scope?.side ?? null} awayName={game.away.team.school} homeName={game.home.team.school} />
          <span className="shrink-0 rounded-xs bg-surface-track px-2 py-0.5 font-display text-clock text-text-secondary">
            {clockLabel(play)}
          </span>
        </div>
        <div
          className={cn(
            'border-l-4 border-team-primary-on-dark py-2',
            flat ? 'bg-surface-track px-3' : 'border-t border-t-border-hairline bg-surface-raised px-3',
          )}
        >
          {who}
        </div>
      </li>
    );
  }

  // Micro row: a single line. The play type never shrinks; the player name truncates first. The detail is visually hidden
  // below a 448px row (container query) so the line never wraps, but stays readable for assistive tech.
  const microClock = flat ? clockLabel(play) : clock(play.clockSeconds);
  return (
    <li
      data-kind="micro"
      title={detail ? `${play.description} (${detail})` : play.description}
      className={cn(
        '@container flex min-h-10 items-center gap-2',
        flat ? 'border-b border-border-hairline px-4 py-2 last:border-b-0' : 'rounded-md border border-border-hairline bg-surface-card px-3',
        className,
      )}
    >
      <span className="flex shrink-0 items-center">{logo}</span>
      <span className="shrink-0 whitespace-nowrap text-footnote font-semibold text-text-primary">{label}</span>
      <span className="min-w-0 flex-1 truncate text-footnote text-text-secondary">
        {player ? playerLabel(player) : play.description}
        {detail && (
          <>
            <span className="sr-only @md:hidden">, </span>
            <span aria-hidden="true" className="hidden @md:inline @md:text-text-tertiary">
              {' · '}
            </span>
            <span className="sr-only @md:not-sr-only @md:text-text-tertiary">{detail}</span>
          </>
        )}
      </span>
      <span className="shrink-0 whitespace-nowrap font-display text-clock text-text-secondary">{microClock}</span>
    </li>
  );
}
