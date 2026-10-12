import { cn } from '../../lib/cn';
import { Chip } from '../../atoms/Chip';
import { PlayerIdentity } from '../../molecules/PlayerIdentity';
import type { Performer, PerformerSection, Side } from './topPerformers.logic';

/*
 * Private sub-component shared by TopPerformers and PlayersToWatch (the same three head-to-head sections).
 * Probably belongs in molecules as `PlayerCompare` (Figma "Block/PlayerCompare" 6947:68373) once a third module needs it.
 */

function PerformerSide({ side, performer, emptyLabel }: { side: Side; performer: Performer | null; emptyLabel: string }) {
  const mirrored = side === 'home';
  if (!performer) {
    return (
      <div data-side={side} className="flex min-h-20 items-center justify-center text-center">
        <p className="text-footnote text-text-tertiary">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div data-side={side} className="flex min-w-0 flex-col items-center gap-1">
      <div className={cn('flex w-full min-w-0 items-start justify-center gap-2', mirrored && 'flex-row-reverse')}>
        <PlayerIdentity player={performer.player} teamColor={performer.teamColor} layout="stacked" side={side} className="min-w-0 flex-1" />
        <div className="flex shrink-0 flex-col items-center pt-1">
          <span className="font-display text-score tabular-nums text-text-primary">{performer.primary.value}</span>
          <span className="text-caption text-text-secondary">{performer.primary.label}</span>
        </div>
      </div>
      {performer.secondary.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-x-2 text-caption tabular-nums text-text-secondary">
          {performer.secondary.map((item) => (
            <li key={item} className="whitespace-nowrap">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface PerformerCompareProps {
  section: PerformerSection;
  /** Team names for the group's accessible label. */
  awayName: string;
  homeName: string;
  className?: string;
}

/** One head-to-head: away player left, category chip in the middle, home player right (mirrored). */
export function PerformerCompare({ section, awayName, homeName, className }: PerformerCompareProps) {
  return (
    <div role="group" aria-label={`${section.title}: ${awayName} versus ${homeName}`} className={cn('grid grid-cols-[1fr_auto_1fr] gap-x-2', className)}>
      <PerformerSide side="away" performer={section.away} emptyLabel={section.emptyLabel} />
      {/* The chip lines up with the avatar row (h-16 avatar, centered), not with the whole block. */}
      <h3 className="flex h-16 items-center">
        <Chip tone="neutral" size="sm" className="text-footnote font-semibold text-text-primary">
          {section.title}
        </Chip>
      </h3>
      <PerformerSide side="home" performer={section.home} emptyLabel={section.emptyLabel} />
    </div>
  );
}
