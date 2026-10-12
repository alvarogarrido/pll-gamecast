import type { GameSummary } from '@pll/data/api';
import type { GameStatusKind } from '@pll/ui';

export const formatClock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Maps an API game to the StatusPill props. */
export function statusPillProps(game: Pick<GameSummary, 'status' | 'clock'>): { status: GameStatusKind; label?: string } {
  switch (game.status) {
    case 'live': {
      const clock = game.clock;
      if (!clock) return { status: 'live' };
      if (clock.phase === 'halftime') return { status: 'halftime' };
      if (clock.phase === 'break') return { status: 'live', label: `End Q${clock.period}` };
      return { status: 'live', label: `Q${clock.period} ${formatClock(clock.clockSeconds)}` };
    }
    case 'final':
      return { status: 'final' };
    case 'delayed':
      return { status: 'scheduled', label: 'Delayed' };
    case 'postponed':
      return { status: 'scheduled', label: 'Postponed' };
    case 'canceled':
      return { status: 'scheduled', label: 'Canceled' };
    case 'scheduled':
      return { status: 'scheduled' };
  }
}

const timeFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** "Sat 7:00 PM" in the viewer's timezone. */
export const formatStartTime = (startTimeIso: string): string => timeFormat.format(Date.parse(startTimeIso));

/** "Starts in 2h 15m" relative to SERVER time (see useServerNow); null when already started or unknown. */
export function formatCountdown(startTimeIso: string, serverNowMs: number | null): string | null {
  if (serverNowMs === null) return null;
  const minutes = Math.round((Date.parse(startTimeIso) - serverNowMs) / 60_000);
  if (minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}
