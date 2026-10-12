import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { KeyTeamStats, KeyTeamStatsSkeleton } from './KeyTeamStats';

const meta = {
  title: 'Organisms/KeyTeamStats',
  component: KeyTeamStats,
  args: { game: fixtures.game(GAMES.scheduled), preview: fixtures.preview(GAMES.scheduled) },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KeyTeamStats>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pre: season averages. */
export const Pregame: Story = {};
export const PregameWithAction: Story = { args: { onSeeAll: () => {} } };
export const PregameIndoor: Story = {
  args: { game: fixtures.game(GAMES.scheduledIndoor), preview: fixtures.preview(GAMES.scheduledIndoor) },
};
export const Live: Story = {
  args: { game: fixtures.game(GAMES.liveQ4), stats: fixtures.stats(GAMES.liveQ4), preview: undefined, onSeeAll: () => {} },
};
export const Final: Story = {
  args: { game: fixtures.game(GAMES.final), stats: fixtures.stats(GAMES.final), preview: undefined, seeAllHref: '#stats' },
};
export const FinalBlowout: Story = {
  args: { game: fixtures.game(GAMES.finalBlowout), stats: fixtures.stats(GAMES.finalBlowout), preview: undefined },
};
/** Neither stats nor preview: empty state. */
export const NoData: Story = { args: { preview: undefined } };
export const Loading: Story = { render: () => <KeyTeamStatsSkeleton /> };
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
