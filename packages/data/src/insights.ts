/**
 * Auto-generated live insights: lead changes, scoring runs, hat tricks, goalie milestones and droughts.
 * Pure function of the visible plays, so the same log always yields the same insights.
 */
import { clockAtElapsed, formatClock, periodLabel } from './clock';
import type { Insight } from './api';
import { shortName, type NameLookup } from './describe';
import type { PlayRecord } from './schema';

export const DROUGHT_SECONDS = 600;
const RUN_THRESHOLDS = [3, 5, 7, 9];
const GOAL_MILESTONES = new Map([
  [3, 'Hat trick'],
  [5, 'Five-goal game'],
]);
const SAVE_MILESTONES = [10, 15];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n: number) => NUMBER_WORDS[n] ?? String(n);

export interface InsightContext {
  gameId: string;
  homeId: string;
  awayId: string;
  names: NameLookup;
}

export function autoInsights(plays: readonly PlayRecord[], ctx: InsightContext, cutoff: number | null): Insight[] {
  const { gameId, homeId, awayId, names } = ctx;
  const school = (id: string) => names.teams.get(id)?.school ?? 'Team';
  const insights: Insight[] = [];
  const counters = new Map<string, number>();
  const add = (
    elapsedSeconds: number,
    kind: Insight['kind'],
    title: string,
    body: string,
    teamId: string | null,
    playerId: string | null,
  ) => {
    const n = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, n);
    const clock = clockAtElapsed(elapsedSeconds);
    insights.push({
      id: `${gameId.slice(0, 8)}-auto-${kind}-${n}`,
      elapsedSeconds,
      period: clock.period,
      clockSeconds: clock.clockSeconds,
      kind,
      title,
      body,
      teamId,
      playerId,
    });
  };
  const when = (elapsed: number) => {
    const c = clockAtElapsed(elapsed);
    return c.clockSeconds === 0 ? `at the end of the ${periodLabel(c.period)}` : `with ${formatClock(c.clockSeconds)} left in the ${periodLabel(c.period)}`;
  };

  const score = new Map<string, number>([
    [homeId, 0],
    [awayId, 0],
  ]);
  const goalsBy = new Map<string, number>();
  const savesBy = new Map<string, number>();
  const goalTimes = new Map<string, number[]>([
    [homeId, [0]],
    [awayId, [0]],
  ]);
  let lastLeader: string | null = null;
  let runTeam: string | null = null;
  let runLength = 0;
  let endElapsed = 0;

  for (const play of plays) {
    endElapsed = Math.max(endElapsed, play.elapsedSeconds);
    if (play.type === 'shot' && play.details.shotResult === 'saved' && play.goalieId) {
      const total = (savesBy.get(play.goalieId) ?? 0) + 1;
      savesBy.set(play.goalieId, total);
      if (SAVE_MILESTONES.includes(total)) {
        const goalie = names.players.get(play.goalieId);
        const opponentId = play.teamId === homeId ? awayId : homeId;
        add(
          play.elapsedSeconds,
          'milestone',
          `${shortName(goalie)} reaches ${total} saves`,
          `${shortName(goalie)} has made ${total} saves for ${school(opponentId)} ${when(play.elapsedSeconds)}.`,
          opponentId,
          play.goalieId,
        );
      }
    }
    if (play.type !== 'goal' || !play.teamId || !play.playerId) continue;

    const scorerTeam = play.teamId;
    const otherTeam = scorerTeam === homeId ? awayId : homeId;
    score.set(scorerTeam, (score.get(scorerTeam) ?? 0) + 1);
    goalTimes.get(scorerTeam)?.push(play.elapsedSeconds);
    const mine = score.get(scorerTeam) ?? 0;
    const theirs = score.get(otherTeam) ?? 0;
    const scorer = shortName(names.players.get(play.playerId));

    // Lead change
    const leader = mine > theirs ? scorerTeam : mine < theirs ? otherTeam : null;
    if (leader && lastLeader && leader !== lastLeader) {
      add(
        play.elapsedSeconds,
        'lead_change',
        `${school(scorerTeam)} takes the lead`,
        `${scorer}'s goal puts ${school(scorerTeam)} ahead ${mine}-${theirs} ${when(play.elapsedSeconds)}.`,
        scorerTeam,
        play.playerId,
      );
    }
    if (leader) lastLeader = leader;

    // Scoring run
    runLength = runTeam === scorerTeam ? runLength + 1 : 1;
    runTeam = scorerTeam;
    if (RUN_THRESHOLDS.includes(runLength)) {
      const standing = mine > theirs ? `leads ${mine}-${theirs}` : mine < theirs ? `trails ${theirs}-${mine}` : `is tied ${mine}-${theirs}`;
      add(
        play.elapsedSeconds,
        'run',
        `${school(scorerTeam)} on a ${runLength}-0 run`,
        `${school(scorerTeam)} has scored ${word(runLength)} unanswered goals and ${standing} ${when(play.elapsedSeconds)}.`,
        scorerTeam,
        null,
      );
    }

    // Individual scoring milestones
    const total = (goalsBy.get(play.playerId) ?? 0) + 1;
    goalsBy.set(play.playerId, total);
    const label = GOAL_MILESTONES.get(total);
    if (label) {
      add(
        play.elapsedSeconds,
        'milestone',
        `${label} for ${scorer}`,
        `${scorer} has ${word(total)} goals for ${school(scorerTeam)} ${when(play.elapsedSeconds)}.`,
        scorerTeam,
        play.playerId,
      );
    }
  }

  // Droughts: a 10-game-minute stretch between goals (or since the opening faceoff) up to the cutoff.
  const horizon = cutoff ?? endElapsed;
  for (const teamId of [homeId, awayId]) {
    const times = [...(goalTimes.get(teamId) ?? [0])];
    times.forEach((start, i) => {
      const end = times[i + 1] ?? horizon;
      if (end - start >= DROUGHT_SECONDS) {
        add(
          start + DROUGHT_SECONDS,
          'drought',
          `${school(teamId)} scoreless for 10 minutes`,
          `${school(teamId)} has gone 10 game minutes without a goal ${when(start + DROUGHT_SECONDS)}.`,
          teamId,
          null,
        );
      }
    });
  }

  return insights.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds || a.id.localeCompare(b.id));
}
