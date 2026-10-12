import { cn } from '../../lib/cn';
import { NO_VALUE, periodLabel } from '../../lib/format';
import { linescorePeriods, winnerSide, type LinescoreGame, type LinescoreSide } from './linescore.logic';

export interface LinescoreProps {
  /** A `GameSummary` / `GameDetail['data']`: status, clock (marks the live period), and per side the team, score and period scores. */
  game: LinescoreGame;
  className?: string;
}

const SIDES: readonly LinescoreSide[] = ['away', 'home'];

/**
 * Compact box score: a row per team (away on top) with Q1..Q4, an OT column for every extra period, and T for the total.
 * The live period is highlighted green; on a final game the losing team's total is dimmed. Periods not played yet show
 * an en dash.
 */
export function Linescore({ game, className }: LinescoreProps) {
  const periods = linescorePeriods(game);
  const winner = winnerSide(game);
  const livePeriod = game.status === 'live' ? (game.clock?.period ?? null) : null;
  return (
    <table className={cn('w-full table-fixed text-caption tabular-nums', className)}>
      <caption className="sr-only">Score by period</caption>
      <thead>
        <tr>
          <th scope="col" className="w-14 text-left font-medium text-text-tertiary">
            <span className="sr-only">Team</span>
          </th>
          {periods.map((p) => (
            <th key={p} scope="col" className={cn('py-0.5 text-center font-medium', p === livePeriod ? 'text-status-live' : 'text-text-tertiary')}>
              {periodLabel(p)}
            </th>
          ))}
          <th scope="col" className="py-0.5 text-center font-medium text-text-tertiary">
            T
          </th>
        </tr>
      </thead>
      <tbody>
        {SIDES.map((side) => {
          const s = game[side];
          const loser = winner !== null && winner !== side;
          return (
            <tr key={side} className="border-t border-border-hairline">
              <th scope="row" className="truncate py-1 text-left font-semibold text-text-primary">
                {s.team.abbreviation}
              </th>
              {periods.map((p) => (
                <td key={p} className={cn('py-1 text-center', p === livePeriod ? 'text-text-primary' : 'text-text-secondary')}>
                  {s.periodScores[p - 1] ?? NO_VALUE}
                </td>
              ))}
              <td className={cn('py-1 text-center font-semibold', loser ? 'text-text-secondary' : 'text-text-primary')}>{s.score ?? NO_VALUE}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
