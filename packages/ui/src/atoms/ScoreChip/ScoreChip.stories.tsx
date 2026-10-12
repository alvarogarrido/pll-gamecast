import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { ScoreChip } from './ScoreChip';

const game = fixtures.game(GAMES.liveQ4);
const { plays } = fixtures.plays(GAMES.liveQ4);
const lastGoal = [...plays].reverse().find((p) => p.type === 'goal')!;
const scoringSide = lastGoal.teamId === game.home.team.id ? 'home' : 'away';

const meta = {
  title: 'Atoms/ScoreChip',
  component: ScoreChip,
  args: { away: 12, home: 11, emphasis: 'away', awayName: 'Duke', homeName: 'Notre Dame' },
  argTypes: { emphasis: { control: 'inline-radio', options: [null, 'away', 'home'] } },
} satisfies Meta<typeof ScoreChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HomeScored: Story = { args: { away: 11, home: 12, emphasis: 'home' } };
export const NoEmphasis: Story = { args: { emphasis: null } };
export const DoubleDigits: Story = { args: { away: 3, home: 15, emphasis: 'home' } };

/** The latest goal of the live fixture game. */
export const FromFixtures: Story = {
  args: {
    away: lastGoal.awayScore,
    home: lastGoal.homeScore,
    emphasis: scoringSide,
    awayName: game.away.team.school,
    homeName: game.home.team.school,
  },
};
