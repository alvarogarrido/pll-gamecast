import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { WinPredictions } from './WinPredictions';

const scheduled = fixtures.game(GAMES.scheduled);
const scheduledPicks = fixtures.preview(GAMES.scheduled).staffPicks;
const ncaa = fixtures.game(GAMES.ncaa);
const ncaaPicks = fixtures.preview(GAMES.ncaa).staffPicks;
const indoor = fixtures.game(GAMES.scheduledIndoor);
const indoorPicks = fixtures.preview(GAMES.scheduledIndoor).staffPicks;
const live = fixtures.game(GAMES.liveQ4);
const livePicks = fixtures.preview(GAMES.liveQ4).staffPicks;

const meta = {
  title: 'Organisms/WinPredictions',
  component: WinPredictions,
  args: { game: scheduled, staffPicks: scheduledPicks },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof WinPredictions>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pregame: Yale at Princeton, picks split 3 to 1. */
export const Pregame: Story = {};
export const Indoor: Story = { args: { game: indoor, staffPicks: indoorPicks } };
export const Ncaa: Story = { args: { game: ncaa, staffPicks: ncaaPicks } };
/** Live (Duke at Notre Dame): the bar follows `game.winProbabilityHome`. */
export const Live: Story = { args: { game: live, staffPicks: livePicks } };
/** Staff split evenly: no leader. */
export const SplitPicks: Story = {
  args: {
    staffPicks: scheduledPicks.map((p, i) => ({ ...p, pickTeamId: i % 2 === 0 ? scheduled.home.team.id : scheduled.away.team.id })),
  },
};
export const NoPicks: Story = { args: { staffPicks: [] } };
export const NoProbability: Story = { args: { game: { ...scheduled, winProbabilityHome: null } } };
export const Loading: Story = { args: { loading: true } };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
