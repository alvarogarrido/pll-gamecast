import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { FilterChip, FilterChipGroup, type FilterChipItem } from './FilterChip';

const meta = {
  title: 'Atoms/FilterChip',
  component: FilterChip,
  args: { children: 'Goals', selected: false },
} satisfies Meta<typeof FilterChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const WithCount: Story = { args: { count: 12 } };
export const SelectedWithCount: Story = { args: { selected: true, count: 12 } };
export const Disabled: Story = { args: { disabled: true } };

type Filter = 'all' | 'goals' | 'shots' | 'faceoffs' | 'turnovers' | 'penalties';
const { plays } = fixtures.plays(GAMES.liveQ4);
const count = (types: string[]) => plays.filter((p) => types.includes(p.type)).length;
const items: FilterChipItem<Filter>[] = [
  { id: 'all', label: 'All', count: plays.length },
  { id: 'goals', label: 'Goals', count: count(['goal']) },
  { id: 'shots', label: 'Shots', count: count(['shot', 'goal']) },
  { id: 'faceoffs', label: 'Faceoffs', count: count(['faceoff']) },
  { id: 'turnovers', label: 'Turnovers', count: count(['turnover']) },
  { id: 'penalties', label: 'Penalties', count: count(['penalty']) },
];

function Controlled({ semantics, layout }: { semantics?: 'pressed' | 'radio'; layout?: 'wrap' | 'scroll' }) {
  const [value, setValue] = useState<Filter>('all');
  return <FilterChipGroup items={items} value={value} onValueChange={setValue} label="Filter plays" semantics={semantics} layout={layout} />;
}

/** Single choice, `aria-pressed` buttons in a `group` (what Play-by-Play uses). Counts come from the live fixture game. */
export const Group: Story = { render: () => <Controlled /> };
/** `radiogroup` semantics: one tab stop, arrow keys move and select. */
export const RadioGroup: Story = { render: () => <Controlled semantics="radio" /> };
/** One swipeable row; it bleeds to the 16px page gutters on phones. */
export const ScrollingRow: Story = {
  render: () => <Controlled layout="scroll" />,
};
export const WrappingInNarrowColumn: Story = {
  render: () => (
    <div className="max-w-xs">
      <Controlled />
    </div>
  ),
};
