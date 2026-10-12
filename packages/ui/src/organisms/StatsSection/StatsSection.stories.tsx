import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { StatsSection, StatsSectionSkeleton } from './StatsSection';

const of = (id: string) => ({ game: fixtures.game(id), stats: fixtures.stats(id) });

const meta = {
  title: 'Organisms/StatsSection',
  component: StatsSection,
  args: of(GAMES.liveQ4),
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Final: Story = { args: of(GAMES.final) };
export const FinalAwayTeam: Story = { args: { ...of(GAMES.final), defaultView: 'away' } };
export const FinalHomeTeam: Story = { args: { ...of(GAMES.final), defaultView: 'home' } };
export const FinalBlowout: Story = { args: of(GAMES.finalBlowout) };
export const LiveEarlyAwayTeam: Story = {
  name: 'Live early (Q1) away team',
  args: { game: fixtures.game(GAMES.liveQ4), stats: fixtures.at(GAMES.liveQ4, 300).stats(), defaultView: 'away' },
};
/** No game stats exist before kickoff: empty state. */
export const Pregame: Story = { args: of(GAMES.scheduled) };
export const Loading: Story = { render: () => <StatsSectionSkeleton /> };
export const Mobile: Story = {
  args: { defaultView: 'away', ...of(GAMES.final) },
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
