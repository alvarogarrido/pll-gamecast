import type { ReactNode } from 'react';
import type { TeamRef } from '@pll/data/api';
import { cn } from '../../lib/cn';
import { teamPairColors } from '../../lib/team-style';
import { Card } from '../../atoms/Card';
import { TeamLogo } from '../../atoms/TeamLogo';
import { ComparisonRow, type ComparisonRowProps } from '../ComparisonRow';

/** One line of the card: the props of a {@link ComparisonRow} plus a stable `id` for the React key. */
export interface StatComparisonCardRow
  extends Pick<ComparisonRowProps, 'label' | 'away' | 'home' | 'format' | 'digits' | 'lowerIsBetter' | 'highlight' | 'awayDisplay' | 'homeDisplay'> {
  id: string;
}

export interface StatComparisonCardProps {
  /** Card title, centered between the logos ("Overview", "Season Avg"). */
  title: string;
  /** Heading level of the title. Default 3 (organisms start at h2 via their SectionHeader). */
  level?: 3 | 4;
  /** The two teams: away logo on the left, home logo on the right. */
  away: TeamRef;
  home: TeamRef;
  rows: readonly StatComparisonCardRow[];
  /** Footer slot under the rows (e.g. a "See all stats" action). */
  footer?: ReactNode;
  className?: string;
}

/**
 * The Figma Team Stats card: team logos either side of a centered title, then {@link ComparisonRow}s (the better side of
 * each row is highlighted). The logos' rings use the pair colors, so look-alike teams stay distinguishable.
 */
export function StatComparisonCard({ title, level = 3, away, home, rows, footer, className }: StatComparisonCardProps) {
  const Heading = level === 3 ? 'h3' : 'h4';
  const colors = teamPairColors(away.colors, home.colors);
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border-hairline px-4 py-3">
        <span className="justify-self-start">
          <TeamLogo src={away.logoUrl} name={`${away.school} ${away.mascot}`} abbreviation={away.abbreviation} color={colors.away} size="sm" />
        </span>
        <Heading className="text-center text-headline font-semibold text-text-primary">{title}</Heading>
        <span className="justify-self-end">
          <TeamLogo src={home.logoUrl} name={`${home.school} ${home.mascot}`} abbreviation={home.abbreviation} color={colors.home} size="sm" />
        </span>
      </div>
      <div className="px-4 py-2">
        {rows.map(({ id, ...row }) => (
          <ComparisonRow key={id} {...row} awayName={away.school} homeName={home.school} />
        ))}
      </div>
      {footer}
    </Card>
  );
}
