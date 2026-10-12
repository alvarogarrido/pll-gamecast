import type { Meta, StoryObj } from '@storybook/react-vite';
import { RankBadge } from './RankBadge';

const meta = {
  title: 'Atoms/RankBadge',
  component: RankBadge,
  args: { rank: 3, kind: 'rank', change: null },
  argTypes: { kind: { control: 'inline-radio', options: ['rank', 'rpi', 'seed'] } },
} satisfies Meta<typeof RankBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ranked: Story = {};
export const MovedUp: Story = { args: { rank: 2, change: 3 } };
export const MovedDown: Story = { args: { rank: 9, change: -2 } };
export const Rpi: Story = { args: { rank: 12, kind: 'rpi', change: 1 } };
export const Seed: Story = { args: { rank: 2, kind: 'seed' } };

/** Unranked teams render nothing. */
export const Unranked: Story = { args: { rank: null } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <RankBadge rank={1} />
      <RankBadge rank={5} change={2} />
      <RankBadge rank={14} change={-4} />
      <RankBadge rank={22} kind="rpi" />
      <RankBadge rank={3} kind="seed" />
    </div>
  ),
};
