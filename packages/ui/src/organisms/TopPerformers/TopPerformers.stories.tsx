import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { TopPerformers, TopPerformersSkeleton } from './TopPerformers';

const live = () => ({ game: fixtures.game(GAMES.liveQ4), stats: fixtures.stats(GAMES.liveQ4) });

const meta = {
  title: 'Organisms/TopPerformers',
  component: TopPerformers,
  args: live(),
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopPerformers>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const LiveEarly: Story = {
  name: 'Live (Q2, Maryland at Johns Hopkins)',
  args: { game: fixtures.game(GAMES.liveQ2), stats: fixtures.stats(GAMES.liveQ2) },
};
/** Very first minutes: some sides have no scorer or no faceoff yet. */
export const LiveJustStarted: Story = {
  args: { game: fixtures.game(GAMES.liveQ4), stats: fixtures.at(GAMES.liveQ4, 150).stats() },
};
export const Final: Story = { args: { game: fixtures.game(GAMES.final), stats: fixtures.stats(GAMES.final) } };
export const FinalBlowout: Story = {
  args: { game: fixtures.game(GAMES.finalBlowout), stats: fixtures.stats(GAMES.finalBlowout) },
};
/** Pregame has no stats: the empty state. */
export const NoData: Story = { args: { game: fixtures.game(GAMES.scheduled), stats: fixtures.stats(GAMES.scheduled) } };
export const Loading: Story = { render: () => <TopPerformersSkeleton /> };
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[375px] max-w-full">
        <Story />
      </div>
    ),
  ],
};
/** Desktop 40% column (~380px). */
export const NarrowColumn: Story = {
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
};
