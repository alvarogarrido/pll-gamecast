import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { TeamScope } from './TeamScope';

const game = fixtures.game(GAMES.liveQ4);

const meta = {
  title: 'Molecules/TeamScope',
  component: TeamScope,
  args: { team: game.away.team },
} satisfies Meta<typeof TeamScope>;
export default meta;
type Story = StoryObj<typeof meta>;

const Swatches = () => (
  <div className="flex items-center gap-2 text-footnote">
    <span className="size-8 rounded-sm bg-team-primary" />
    <span className="size-8 rounded-sm bg-team-secondary" />
    <span className="border-b-4 border-team-primary pb-1 text-team-secondary">Primary border, secondary text</span>
  </div>
);

export const Default: Story = { render: (args) => <TeamScope {...args}><Swatches /></TeamScope> };

export const BothTeamsAndFallback: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TeamScope team={game.away.team}><Swatches /></TeamScope>
      <TeamScope team={game.home.team}><Swatches /></TeamScope>
      <div>
        <p className="mb-1 text-caption text-text-tertiary">No scope: neutral token fallback</p>
        <Swatches />
      </div>
    </div>
  ),
};

export const Nested: Story = {
  render: () => (
    <TeamScope team={game.home.team} className="rounded-md border-2 border-team-primary p-4">
      <p className="mb-2 text-footnote text-text-secondary">{game.home.team.school}</p>
      <TeamScope team={game.away.team} className="rounded-md border-2 border-team-primary p-4">
        <p className="mb-2 text-footnote text-text-secondary">{game.away.team.school}, nested: the closest scope wins</p>
        <Swatches />
      </TeamScope>
    </TeamScope>
  ),
};
