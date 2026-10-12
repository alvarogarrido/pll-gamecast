import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../atoms/Card';
import { fixtures, GAMES } from '../../fixtures';
import { ComparisonBar } from './ComparisonBar';

const meta = {
  title: 'Molecules/ComparisonBar',
  component: ComparisonBar,
  args: { away: 43, home: 50, awayColor: '#E8590C', homeColor: '#0C2340', label: 'Shots', awayName: 'Duke', homeName: 'Notre Dame' },
  decorators: [
    (Story) => (
      <Card className="mx-auto max-w-sm">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof ComparisonBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const BarOnly: Story = { args: { label: undefined } };
export const Percent: Story = { args: { away: 0.392, home: 0.539, label: 'Possession', format: 'pct' } };
export const OneSided: Story = { args: { away: 0, home: 7, label: 'Extra-man goals' } };
export const BothZero: Story = { args: { away: 0, home: 0, label: 'Penalties' } };
export const NoTeamColors: Story = { args: { awayColor: undefined, homeColor: undefined } };

export const FromFixtures: Story = {
  render: () => {
    const game = fixtures.game(GAMES.liveQ4);
    const { teams } = fixtures.stats(GAMES.liveQ4);
    const a = teams.find((t) => t.teamId === game.away.team.id)!;
    const h = teams.find((t) => t.teamId === game.home.team.id)!;
    const props = {
      awayColor: game.away.team.colors.primary,
      homeColor: game.home.team.colors.primary,
      awayName: game.away.team.school,
      homeName: game.home.team.school,
    };
    return (
      <div className="flex flex-col gap-4">
        <ComparisonBar {...props} label="Shots" away={a.shots} home={h.shots} />
        <ComparisonBar {...props} label="Ground balls" away={a.groundBalls} home={h.groundBalls} />
        <ComparisonBar {...props} label="Faceoffs won" away={a.faceoffsWon} home={h.faceoffsWon} />
      </div>
    );
  },
};
