'use client';

import { Tabs } from '@pll/ui';
import { GAME_TABS, TAB_LABELS, type GameTab } from './tabs';

export const SECTION_ID_BASE = 'game-section';

const items = GAME_TABS.map((value) => ({ value, label: TAB_LABELS[value] }));

/** PRD module: SectionSelector. Segmented control over the four game sections. */
export function SectionSelector({ tab, onTabChange }: { tab: GameTab; onTabChange: (tab: GameTab) => void }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-surface-page/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      <Tabs
        items={items}
        value={tab}
        onValueChange={onTabChange}
        ariaLabel="Game sections"
        idBase={SECTION_ID_BASE}
        fullWidth
      />
    </div>
  );
}
