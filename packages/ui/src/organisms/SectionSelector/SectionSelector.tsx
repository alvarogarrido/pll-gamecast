import { Tabs, tabPanelProps, type TabItem } from '../../atoms/Tabs';
import { cn } from '../../lib/cn';

export type GamecastSection = 'gamecast' | 'stats' | 'plays' | 'highlights';

export interface SectionSelectorProps {
  value: GamecastSection;
  onChange: (section: GamecastSection) => void;
  /**
   * Which sections the current game has. Omitted keys count as available. Pregame:
   * `availabilityFor('pre')` = Gamecast only. An unavailable Highlights is always hidden; Stats and Plays are
   * greyed out and not selectable (or hidden with `unavailable="hide"`).
   */
  available?: Partial<Record<GamecastSection, boolean>>;
  /** What to do with an unavailable Stats / Plays: `disable` (default) or `hide`. */
  unavailable?: 'disable' | 'hide';
  /** Prefix for tab ids. Pass the same value to `sectionPanelProps` to wire panels to their tabs. */
  idBase?: string;
  /** Stretch the pills across the container (default). Off = pills at their natural width, scrolling if they overflow. */
  fullWidth?: boolean;
  className?: string;
}

const SECTIONS: readonly { value: GamecastSection; label: string }[] = [
  { value: 'gamecast', label: 'Gamecast' },
  { value: 'stats', label: 'Stats' },
  { value: 'plays', label: 'Play-by-Play' },
  { value: 'highlights', label: 'Highlights' },
];

/** What a game phase offers: pregame has only the Gamecast; live and final have everything. */
export function availabilityFor(phase: 'pre' | 'live' | 'final'): Record<GamecastSection, boolean> {
  const started = phase !== 'pre';
  return { gamecast: true, stats: started, plays: started, highlights: started };
}

/** Props for the panel that belongs to a section: `<div {...sectionPanelProps(idBase, 'stats')}>`. */
export const sectionPanelProps = (idBase: string, section: GamecastSection) => tabPanelProps(idBase, section);

// Figma "Filter Nav" (81:2264): no track, 13px sentence-case labels, the selected pill is a 2px white outline.
// The Tabs atom styles its buttons with plain utilities, so these child-selector overrides (higher specificity) restyle
// them from here without forking the atom.
const filterNavLook = [
  '[&[role=tablist]]:bg-transparent [&[role=tablist]]:p-0',
  '[&>button]:border-2 [&>button]:border-transparent [&>button]:px-1 [&>button]:normal-case [&>button]:font-normal',
  // Under 320px of container (a 320px phone) the longest label, "Play-by-Play" (D7), only fits at 12px with tighter padding.
  '[&>button]:text-caption @xs:[&>button]:px-2 @xs:[&>button]:text-footnote sm:[&>button]:text-footnote @md:[&>button]:px-4',
  '[&>button[aria-selected=true]]:border-text-primary [&>button[aria-selected=true]]:bg-transparent',
].join(' ');

/**
 * Gamecast / Stats / Play-by-Play / Highlights switch under the header: the `Tabs` atom (accessible tablist, arrow keys, Home / End)
 * in Figma's outlined-pill look. Controlled: the page owns `value` (it lives in `?tab=`).
 */
export function SectionSelector({ value, onChange, available, unavailable = 'disable', idBase, fullWidth = true, className }: SectionSelectorProps) {
  const items: TabItem<GamecastSection>[] = [];
  for (const section of SECTIONS) {
    if (available?.[section.value] ?? true) items.push(section);
    else if (section.value !== 'highlights' && unavailable === 'disable') items.push({ ...section, disabled: true });
  }
  return (
    <div className={cn('@container', className)}>
      <Tabs items={items} value={value} onValueChange={onChange} ariaLabel="Game sections" idBase={idBase} fullWidth={fullWidth} className={filterNavLook} />
    </div>
  );
}
