import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { teamPairColors } from '../../lib/team-style';
import { Card } from '../../atoms/Card';
import { TeamPercent } from './TeamPercent';

const game = fixtures.game(GAMES.liveQ4);
const colors = teamPairColors(game.away.team.colors, game.home.team.colors);

const meta = {
  title: 'Molecules/TeamPercent',
  component: TeamPercent,
  args: { team: game.away.team, value: 0.433, side: 'away', layout: 'inline' },
  argTypes: {
    side: { control: 'inline-radio', options: ['away', 'home'] },
    layout: { control: 'inline-radio', options: ['inline', 'tile'] },
  },
  decorators: [(Story) => <Card className="mx-auto max-w-sm"><Story /></Card>],
} satisfies Meta<typeof TeamPercent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = { args: { team: game.home.team, value: 0.567, side: 'home' } };
export const NoValue: Story = { args: { value: null } };
/** Both teams of the live fixture game, mirrored around the middle, as in the win-probability header. */
export const Pair: Story = {
  render: () => (
    <div className="flex items-center justify-between gap-2">
      <TeamPercent team={game.away.team} value={0.433} side="away" color={colors.away} />
      <TeamPercent team={game.home.team} value={0.567} side="home" color={colors.home} />
    </div>
  ),
};
export const Tile: Story = { args: { layout: 'tile', digits: 0 } };
export const TileHighlighted: Story = { args: { layout: 'tile', digits: 0, highlighted: true, value: 0.567 } };
export const TilePair: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-2">
      <TeamPercent layout="tile" team={game.away.team} value={0.433} digits={0} color={colors.away} />
      <TeamPercent layout="tile" team={game.home.team} value={0.567} digits={0} highlighted color={colors.home} />
    </div>
  ),
};
