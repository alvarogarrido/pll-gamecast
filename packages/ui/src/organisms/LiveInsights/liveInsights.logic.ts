import type { Insight, PlayerRef } from '@pll/data/api';
import type { IconName } from '@pll/icons';

/** Icon per insight kind: fire = run/streak, trend-up = lead change, trophy = milestone/record, clock = drought. */
export function insightIcon(kind: Insight['kind']): IconName {
  switch (kind) {
    case 'run':
    case 'streak':
      return 'fire';
    case 'lead_change':
      return 'trend-up';
    case 'milestone':
    case 'record':
      return 'trophy';
    case 'drought':
      return 'clock';
    case 'note':
      return 'info';
  }
}

/** Spoken/visible kind label for the icon ("Run", "Lead change"). */
export function insightKindLabel(kind: Insight['kind']): string {
  switch (kind) {
    case 'run':
      return 'Run';
    case 'streak':
      return 'Streak';
    case 'lead_change':
      return 'Lead change';
    case 'milestone':
      return 'Milestone';
    case 'record':
      return 'Record';
    case 'drought':
      return 'Drought';
    case 'note':
      return 'Note';
  }
}

/** Newest first (by game time, then by id for a stable order). Does not mutate. */
export function sortInsights(insights: readonly Insight[]): Insight[] {
  return [...insights].sort((a, b) => b.elapsedSeconds - a.elapsedSeconds || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

export interface InsightSplit {
  latest: Insight | null;
  /** Older insights to show now (at most `maxOlder`, or all when expanded). */
  older: Insight[];
  /** Older insights still hidden behind "Show more". */
  hidden: number;
}

/** Latest highlighted, then at most `maxOlder` (default 3) older ones; `expanded` shows every one. */
export function splitInsights(insights: readonly Insight[], { maxOlder = 3, expanded = false } = {}): InsightSplit {
  const sorted = sortInsights(insights);
  const [latest = null, ...rest] = sorted;
  const older = expanded ? rest : rest.slice(0, maxOlder);
  return { latest, older, hidden: rest.length - older.length };
}

/** The player an insight is about, found in `playerRefs`; `null` for team-level insights or when the ref is missing. */
export function insightPlayer(insight: Pick<Insight, 'playerId'>, playerRefs: readonly PlayerRef[] = []): PlayerRef | null {
  if (!insight.playerId) return null;
  return playerRefs.find((p) => p.id === insight.playerId) ?? null;
}
