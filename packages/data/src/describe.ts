/** Play-by-play text. One concise style: "GOAL by B. Dowd (DUKE). Assist: J. Smith." */
import { periodLabel } from './clock';
import type { PlayRecord } from './schema';

export interface PersonLike {
  firstName: string;
  lastName: string;
}
export interface TeamLike {
  id: string;
  abbreviation: string;
  school: string;
}
export interface NameLookup {
  players: ReadonlyMap<string, PersonLike>;
  teams: ReadonlyMap<string, TeamLike>;
}

/** "B. Dowd" */
export function shortName(person: PersonLike | undefined): string {
  if (!person) return 'Unknown';
  const initial = person.firstName.charAt(0);
  return initial ? `${initial}. ${person.lastName}` : person.lastName;
}

const quarterName = (period: number) => (period <= 4 ? `${periodLabel(period)} quarter` : periodLabel(period) === 'OT' ? 'overtime' : `${periodLabel(period)} overtime`);

export function describePlay(play: PlayRecord, names: NameLookup): string {
  const who = (id: string | null) => shortName(id ? names.players.get(id) : undefined);
  const abbr = (id: string | null) => (id ? (names.teams.get(id)?.abbreviation ?? '?') : '?');
  const withTeam = (playerId: string | null, teamId: string | null) => `${who(playerId)} (${abbr(teamId)})`;

  switch (play.type) {
    case 'period_start':
      return `Start of ${quarterName(play.period)}.`;
    case 'period_end':
      return `End of ${quarterName(play.period)}.`;
    case 'faceoff':
      return `Faceoff won by ${withTeam(play.playerId, play.teamId)} over ${who(play.opponentPlayerId)}.`;
    case 'goal': {
      const emo = play.details.extraMan ? ', extra-man' : '';
      const assist = play.assistPlayerId ? `Assist: ${who(play.assistPlayerId)}.` : 'Unassisted.';
      return `GOAL by ${withTeam(play.playerId, play.teamId)}${emo}. ${assist}`;
    }
    case 'shot': {
      const shooter = withTeam(play.playerId, play.teamId);
      switch (play.details.shotResult) {
        case 'saved':
          return `Shot by ${shooter} saved by ${who(play.goalieId)}.`;
        case 'wide':
          return `Shot by ${shooter} wide.`;
        case 'pipe':
          return `Shot by ${shooter} hits the pipe.`;
        case 'blocked':
          return `Shot by ${shooter} blocked.`;
        default:
          return `Shot by ${shooter}.`;
      }
    }
    case 'ground_ball':
      return `Ground ball by ${withTeam(play.playerId, play.teamId)}.`;
    case 'turnover': {
      const base = `Turnover by ${withTeam(play.playerId, play.teamId)}`;
      return play.opponentPlayerId ? `${base}, caused by ${who(play.opponentPlayerId)}.` : `${base}.`;
    }
    case 'clear': {
      const kind = play.details.cleared === false ? 'Failed clear' : 'Successful clear';
      return `${kind} by ${withTeam(play.playerId, play.teamId)}.`;
    }
    case 'penalty': {
      const name = play.details.penaltyName ?? 'Penalty';
      const secs = play.details.penaltySeconds ? ` (${play.details.penaltySeconds} sec)` : '';
      return `Penalty on ${withTeam(play.playerId, play.teamId)}: ${name}${secs}.`;
    }
    case 'timeout':
      return `Timeout ${abbr(play.teamId)}.`;
  }
}

/** Flatten PlayRecord.details into the primitive-only record the API exposes. */
export function flattenDetails(details: PlayRecord['details']): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}
