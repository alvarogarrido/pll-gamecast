import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { InjuryReport } from './InjuryReport';

const liveGame = fixtures.game(GAMES.liveQ4);
const liveInjuries = fixtures.preview(GAMES.liveQ4).injuries;
const ncaaGame = fixtures.game(GAMES.ncaa);
const ncaaInjuries = fixtures.preview(GAMES.ncaa).injuries;
const scheduledGame = fixtures.game(GAMES.scheduled);
const scheduledInjuries = fixtures.preview(GAMES.scheduled).injuries;

const meta = {
  title: 'Organisms/InjuryReport',
  component: InjuryReport,
  args: { injuries: liveInjuries, game: liveGame },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof InjuryReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Live game (Duke at Notre Dame): one team may have injuries, the other is listed as healthy. */
export const Live: Story = {};

/** NCAA game, two injured teams. */
export const Ncaa: Story = { args: { injuries: ncaaInjuries, game: ncaaGame } };

/** All four statuses on one team, to compare the chip tints (out / doubtful / questionable / day-to-day). */
export const EveryStatus: Story = {
  args: {
    game: liveGame,
    injuries: (['out', 'doubtful', 'questionable', 'day_to_day'] as const).map((status, i) => ({
      ...liveInjuries[0]!,
      playerId: `demo-${i}`,
      status,
      player: { ...liveInjuries[0]!.player, id: `demo-${i}`, lastName: `Player${i + 1}`, teamId: liveGame.away.team.id },
    })),
  },
};

/** Pregame (Yale at Princeton): nothing reported for either team. */
export const NoInjuries: Story = { args: { injuries: scheduledInjuries, game: scheduledGame } };

export const Loading: Story = { args: { loading: true } };

export const Mobile: Story = {
  args: { injuries: ncaaInjuries, game: ncaaGame },
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
