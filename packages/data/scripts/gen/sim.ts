/**
 * Lacrosse game simulator: possession-by-possession, emitting the play log every stat is derived from.
 *
 * Rules modelled: 4 x 15:00 periods, 80-second shot clock, faceoff to open every period and after every goal,
 * sudden-victory OT periods of 4:00, timed penalties that give the opponent an extra-man opportunity.
 */
import { elapsedOf, OT_SECONDS, PERIOD_SECONDS, REGULATION_PERIODS } from '../../src/clock';
import type { PlayRecord, PlayType, Position } from '../../src/schema';
import type { Rng } from './rng';

export interface SimPlayer {
  id: string;
  position: Position;
  /** ~1.0 = average. For FO specialists this is their baseline faceoff win rate (~0.42-0.65). */
  talent: number;
}

export interface SimTeam {
  id: string;
  /** Offensive and defensive multipliers, ~0.93-1.07. */
  off: number;
  def: number;
  /** Only players available for this game. */
  players: SimPlayer[];
}

export interface SimInput {
  gameId: string;
  home: SimTeam;
  away: SimTeam;
  rng: Rng;
  neutralSite?: boolean;
}

const SHOT_CLOCK = 80;
const MAX_OT_PERIODS = 8;

const TECHNICAL = ['Offsides', 'Illegal procedure', 'Holding', 'Interference', 'Pushing', 'Warding'];
const PERSONAL = ['Slashing', 'Tripping', 'Cross-check', 'Illegal body check', 'Unnecessary roughness', 'Unsportsmanlike conduct'];

interface Lineup {
  A: SimPlayer[];
  M: SimPlayer[];
  D: SimPlayer[];
  LSM: SimPlayer[];
  SSDM: SimPlayer[];
  FO: SimPlayer[];
  goalies: SimPlayer[];
  /** Period from which the backup goalie plays (null = starter all game). */
  backupFromPeriod: number | null;
}

interface Side {
  team: SimTeam;
  lineup: Lineup;
  timeoutsLeft: number;
}

interface ManDown {
  teamId: string;
  until: number;
}

type Style = 'normal' | 'transition' | 'second_chance';
type Next = { side: Side; style: Style } | 'faceoff';

const byTalent = (a: SimPlayer, b: SimPlayer) => b.talent - a.talent || a.id.localeCompare(b.id);

function buildLineup(rng: Rng, players: SimPlayer[]): Lineup {
  const group = (position: Position) => players.filter((p) => p.position === position).sort(byTalent);
  const dress = (position: Position, n: number) =>
    rng.sampleWithout(group(position), n, (p) => Math.pow(p.talent, 1.6)).sort(byTalent);
  const goalies = group('G');
  const hasBackup = goalies.length > 1;
  return {
    A: dress('A', 5),
    M: dress('M', 7),
    D: dress('D', 4),
    LSM: dress('LSM', 2),
    SSDM: dress('SSDM', 2),
    FO: group('FO'),
    goalies,
    backupFromPeriod: hasBackup && rng.chance(0.12) ? rng.pick([3, 4]) : null,
  };
}

/** Role weights for choosing who is involved in each kind of event. */
const SHOOTER_WEIGHTS: Partial<Record<Position, number>> = { A: 1, M: 0.62, SSDM: 0.05, LSM: 0.03, D: 0.02 };
const ASSIST_WEIGHTS: Partial<Record<Position, number>> = { A: 1, M: 0.8 };
const GROUND_BALL_WEIGHTS: Partial<Record<Position, number>> = { M: 1, D: 0.8, LSM: 1.2, SSDM: 1, A: 0.45, FO: 0.35 };
const TURNOVER_WEIGHTS: Partial<Record<Position, number>> = { A: 1, M: 1, D: 0.12, LSM: 0.15, SSDM: 0.1 };
const CAUSER_WEIGHTS: Partial<Record<Position, number>> = { D: 1, LSM: 1, SSDM: 0.9, M: 0.4 };
const PENALTY_WEIGHTS: Partial<Record<Position, number>> = { D: 1, LSM: 0.9, SSDM: 0.7, M: 0.8, A: 0.4 };
const CLEARER_WEIGHTS: Partial<Record<Position, number>> = { D: 1, LSM: 1, SSDM: 0.6 };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function simulateGame(input: SimInput): PlayRecord[] {
  const { rng, gameId } = input;
  const idPrefix = gameId.slice(0, 8);
  const homeBoost = input.neutralSite ? 1 : 1.012;
  const home: Side = {
    team: { ...input.home, off: input.home.off * homeBoost },
    lineup: buildLineup(rng, input.home.players),
    timeoutsLeft: 3,
  };
  const away: Side = { team: input.away, lineup: buildLineup(rng, input.away.players), timeoutsLeft: 3 };
  const other = (side: Side): Side => (side === home ? away : home);

  const plays: PlayRecord[] = [];
  const score = new Map<string, number>([
    [home.team.id, 0],
    [away.team.id, 0],
  ]);
  const manDown: ManDown[] = [];
  let period = 1;
  let clock = PERIOD_SECONDS;
  let over = false;
  let runTeam: string | null = null;
  let runLength = 0;

  const now = () => elapsedOf(period, clock);
  const advance = (seconds: number) => {
    clock = Math.max(0, clock - Math.max(0, Math.round(seconds)));
  };

  function emit(type: PlayType, fields: Partial<Omit<PlayRecord, 'id' | 'seq' | 'type'>> = {}): void {
    const seq = plays.length;
    plays.push({
      id: `${idPrefix}-${seq}`,
      seq,
      period,
      clockSeconds: clock,
      elapsedSeconds: now(),
      type,
      teamId: null,
      playerId: null,
      assistPlayerId: null,
      goalieId: null,
      opponentPlayerId: null,
      details: {},
      ...fields,
    });
  }

  // ---- participant selection ------------------------------------------------------------------

  function pickByRole(
    side: Side,
    weights: Partial<Record<Position, number>>,
    exclude?: string,
    invertTalent = false,
  ): SimPlayer {
    const l = side.lineup;
    const pool = [...l.A, ...l.M, ...l.D, ...l.LSM, ...l.SSDM, ...l.FO].filter(
      (p) => (weights[p.position] ?? 0) > 0 && p.id !== exclude,
    );
    const source = pool.length > 0 ? pool : [...l.A, ...l.M, ...l.D];
    return rng.weighted(source, (p) => (weights[p.position] ?? 0.1) * (invertTalent ? 1 / p.talent : p.talent));
  }

  function goalieOf(side: Side): SimPlayer {
    const { goalies, backupFromPeriod } = side.lineup;
    const useBackup = backupFromPeriod !== null && period >= backupFromPeriod;
    return (useBackup ? goalies[1] : goalies[0]) ?? (goalies[0] as SimPlayer);
  }

  function faceoffMan(side: Side): SimPlayer {
    const [primary, secondary] = side.lineup.FO;
    return secondary && rng.chance(0.3) ? secondary : (primary as SimPlayer);
  }

  // ---- game state helpers ---------------------------------------------------------------------

  const margin = (side: Side) => (score.get(side.team.id) ?? 0) - (score.get(other(side).team.id) ?? 0);

  function isExtraMan(offense: Side): boolean {
    const defenseId = other(offense).team.id;
    return manDown.some((p) => p.teamId === defenseId && p.until > now());
  }

  function releasePenalty(defenseId: string): void {
    const i = manDown.findIndex((p) => p.teamId === defenseId && p.until > now());
    if (i >= 0) manDown.splice(i, 1);
  }

  // ---- events ---------------------------------------------------------------------------------

  function groundBall(side: Side, preferred?: SimPlayer): SimPlayer {
    const player = preferred ?? pickByRole(side, GROUND_BALL_WEIGHTS);
    emit('ground_ball', { teamId: side.team.id, playerId: player.id });
    return player;
  }

  function faceoff(): Next {
    advance(rng.int(1, 3));
    const homeMan = faceoffMan(home);
    const awayMan = faceoffMan(away);
    const pHome = clamp(0.5 + (homeMan.talent - awayMan.talent), 0.2, 0.8);
    const winner = rng.chance(pHome) ? home : away;
    const [winnerMan, loserMan] = winner === home ? [homeMan, awayMan] : [awayMan, homeMan];
    emit('faceoff', { teamId: winner.team.id, playerId: winnerMan.id, opponentPlayerId: loserMan.id });
    if (rng.chance(0.6)) {
      advance(rng.int(1, 2));
      groundBall(winner, rng.chance(0.3) ? winnerMan : undefined);
    }
    return { side: winner, style: rng.chance(0.4) ? 'transition' : 'normal' };
  }

  function penalty(committing: Side): void {
    const technical = rng.chance(0.6);
    const seconds = technical ? 30 : 60;
    const player = pickByRole(committing, PENALTY_WEIGHTS);
    emit('penalty', {
      teamId: committing.team.id,
      playerId: player.id,
      details: { penaltyName: rng.pick(technical ? TECHNICAL : PERSONAL), penaltySeconds: seconds },
    });
    manDown.push({ teamId: committing.team.id, until: now() + seconds });
  }

  function clearAttempt(clearing: Side, fromGoalie: boolean): Next {
    advance(rng.int(2, 5));
    const rider = other(clearing);
    const goalie = goalieOf(clearing);
    const clearer = fromGoalie && rng.chance(0.55) ? goalie : pickByRole(clearing, CLEARER_WEIGHTS);
    const cleared = rng.chance(clamp(0.87 * Math.pow(clearing.team.def / rider.team.def, 0.8), 0.7, 0.95));
    emit('clear', { teamId: clearing.team.id, playerId: clearer.id, details: { cleared } });
    if (cleared) return { side: clearing, style: 'normal' };
    advance(1);
    if (rng.chance(0.55)) groundBall(rider);
    return { side: rider, style: 'transition' };
  }

  function turnover(offense: Side): Next {
    const defense = other(offense);
    const committer = pickByRole(offense, TURNOVER_WEIGHTS, undefined, true);
    const caused = rng.chance(0.45);
    const causer = caused ? pickByRole(defense, CAUSER_WEIGHTS) : null;
    emit('turnover', {
      teamId: offense.team.id,
      playerId: committer.id,
      opponentPlayerId: causer?.id ?? null,
      details: caused ? { causedTurnover: true } : {},
    });
    if (rng.chance(0.5)) {
      advance(1);
      groundBall(defense, causer ?? undefined);
    }
    return { side: defense, style: rng.chance(0.3) ? 'transition' : 'normal' };
  }

  function maybeTimeout(side: Side): void {
    if (side.timeoutsLeft <= 0) return;
    side.timeoutsLeft -= 1;
    emit('timeout', { teamId: side.team.id });
  }

  function afterGoal(scorer: Side): void {
    const opponent = other(scorer);
    runLength = runTeam === scorer.team.id ? runLength + 1 : 1;
    runTeam = scorer.team.id;
    const lateAndTrailing = period >= 4 && clock < 180 && margin(opponent) < 0;
    if ((runLength >= 3 && rng.chance(0.5)) || (lateAndTrailing && rng.chance(0.2))) maybeTimeout(opponent);
  }

  function shot(offense: Side, style: Style): Next {
    const defense = other(offense);
    const extra = isExtraMan(offense);
    const shooter = pickByRole(offense, SHOOTER_WEIGHTS);
    const goalie = goalieOf(defense);

    let pGoal =
      (0.275 * (offense.team.off / defense.team.def) * Math.pow(shooter.talent, 0.3)) / Math.pow(goalie.talent, 0.6);
    if (extra) pGoal *= 1.55;
    if (style === 'transition') pGoal *= 1.12;
    pGoal = clamp(pGoal, 0.08, 0.7);

    const roll = rng.next();
    if (roll < pGoal) {
      const assisted = rng.chance(0.55);
      const assister = assisted ? pickByRole(offense, ASSIST_WEIGHTS, shooter.id) : null;
      emit('goal', {
        teamId: offense.team.id,
        playerId: shooter.id,
        assistPlayerId: assister?.id ?? null,
        goalieId: goalie.id,
        details: extra ? { shotResult: 'goal', extraMan: true } : { shotResult: 'goal' },
      });
      score.set(offense.team.id, (score.get(offense.team.id) ?? 0) + 1);
      if (extra) releasePenalty(defense.team.id);
      afterGoal(offense);
      if (period > REGULATION_PERIODS) over = true;
      return 'faceoff';
    }

    const mass = 1 - pGoal;
    const weights = { saved: 0.36 * Math.pow(goalie.talent, 0.6), wide: 0.2, blocked: 0.12, pipe: 0.045 };
    const total = weights.saved + weights.wide + weights.blocked + weights.pipe;
    const r = ((roll - pGoal) / mass) * total;
    const shotResult =
      r < weights.saved ? 'saved' : r < weights.saved + weights.wide ? 'wide' : r < total - weights.pipe ? 'blocked' : 'pipe';
    emit('shot', {
      teamId: offense.team.id,
      playerId: shooter.id,
      goalieId: goalie.id,
      details: extra ? { shotResult, extraMan: true } : { shotResult },
    });
    return afterMiss(offense, shotResult);
  }

  function afterMiss(offense: Side, result: 'saved' | 'wide' | 'blocked' | 'pipe'): Next {
    const defense = other(offense);
    advance(1);
    switch (result) {
      case 'saved':
        if (rng.chance(0.14)) {
          groundBall(offense);
          return { side: offense, style: 'second_chance' };
        }
        return clearAttempt(defense, true);
      case 'wide':
        return rng.chance(0.4) ? { side: offense, style: 'second_chance' } : clearAttempt(defense, true);
      case 'pipe':
        if (rng.chance(0.55)) {
          groundBall(offense);
          return { side: offense, style: 'second_chance' };
        }
        return clearAttempt(defense, true);
      case 'blocked': {
        const winner = rng.chance(0.5) ? offense : defense;
        groundBall(winner);
        return { side: winner, style: winner === offense ? 'second_chance' : 'transition' };
      }
    }
  }

  function possessionSeconds(offense: Side, style: Style): number {
    const base = style === 'normal' ? 12 + rng.exp(41) : style === 'transition' ? 4 + rng.exp(15) : 3 + rng.exp(11);
    let seconds = base;
    if (period >= 4 && clock < 360) {
      const lead = margin(offense);
      if (lead > 0) seconds *= 1.7;
      else if (lead < 0) seconds *= 0.65;
    }
    return clamp(Math.round(seconds), 1, SHOT_CLOCK);
  }

  function possession(side: Side, style: Style): Next {
    const duration = Math.min(possessionSeconds(side, style), clock);

    // A foul can interrupt the possession.
    if (rng.chance(0.042)) {
      advance(rng.int(0, Math.floor(duration / 2)));
      const defense = other(side);
      if (rng.chance(0.55)) {
        penalty(defense);
        advance(duration - Math.floor(duration / 2));
      } else {
        penalty(side);
        return { side: defense, style: 'normal' };
      }
    } else {
      advance(duration);
    }

    const extra = isExtraMan(side);
    const pTurnover = clamp(0.26 * Math.pow(other(side).team.def / side.team.off, 1.2) * (extra ? 0.6 : 1), 0.1, 0.4);
    if (rng.chance(pTurnover)) return turnover(side);
    return shot(side, style);
  }

  // ---- period flow ----------------------------------------------------------------------------

  function playPeriod(): void {
    emit('period_start');
    let next: Next = faceoff();
    while (clock > 0 && !over) {
      if (next === 'faceoff') {
        next = faceoff();
        continue;
      }
      next = possession(next.side, next.style);
      if (next !== 'faceoff' && clock > 0 && !over && rng.chance(0.02)) maybeTimeout(next.side);
    }
    emit('period_end');
  }

  for (period = 1; period <= REGULATION_PERIODS; period++) {
    clock = PERIOD_SECONDS;
    playPeriod();
  }
  let otPeriods = 0;
  while ((score.get(home.team.id) ?? 0) === (score.get(away.team.id) ?? 0) && otPeriods < MAX_OT_PERIODS) {
    period = REGULATION_PERIODS + 1 + otPeriods;
    clock = OT_SECONDS;
    otPeriods += 1;
    playPeriod();
  }
  return plays;
}
