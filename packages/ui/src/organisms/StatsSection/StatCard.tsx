import type { GameDetail } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { Card } from '../../atoms/Card';
import { TeamLogo } from '../../atoms/TeamLogo';
import { ComparisonRow } from '../../molecules/ComparisonRow';
import type { TeamStatRow } from './statsSection.logic';

/*
 * Private sub-component shared by StatsSection and KeyTeamStats: the Figma Team Stats card (team logos on the sides of a
 * centered title, then ComparisonRows). Probably belongs in molecules as `StatComparisonCard`.
 */

type Teams = Pick<GameDetail['data'], 'away' | 'home'>;

export interface StatCardProps {
  title: string;
  /** Heading level of the title. Default 3 (organisms start at h2 via their SectionHeader). */
  level?: 3 | 4;
  game: Teams;
  rows: readonly TeamStatRow[];
  /** Footer slot (e.g. the "See all stats" action). */
  footer?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, level = 3, game, rows, footer, className }: StatCardProps) {
  const Heading = level === 3 ? 'h3' : 'h4';
  const { away, home } = game;
  const awayName = away.team.school;
  const homeName = home.team.school;
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border-hairline px-4 py-3">
        <span className="justify-self-start">
          <TeamLogo src={away.team.logoUrl} name={`${awayName} ${away.team.mascot}`} abbreviation={away.team.abbreviation} color={away.team.colors.primary} size="sm" />
        </span>
        <Heading className="text-center text-headline font-semibold text-text-primary">{title}</Heading>
        <span className="justify-self-end">
          <TeamLogo src={home.team.logoUrl} name={`${homeName} ${home.team.mascot}`} abbreviation={home.team.abbreviation} color={home.team.colors.primary} size="sm" />
        </span>
      </div>
      <div className="px-4 py-2">
        {rows.map((r) => (
          <ComparisonRow
            key={r.id}
            label={r.label}
            away={r.away}
            home={r.home}
            format={r.format}
            digits={r.digits}
            lowerIsBetter={r.lowerIsBetter}
            awayDisplay={r.awayDisplay}
            homeDisplay={r.homeDisplay}
            awayName={awayName}
            homeName={homeName}
          />
        ))}
      </div>
      {footer}
    </Card>
  );
}
