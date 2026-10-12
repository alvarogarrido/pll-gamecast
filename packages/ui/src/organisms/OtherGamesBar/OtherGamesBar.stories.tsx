import type { Meta, StoryObj } from '@storybook/react-vite';
import { db, fixtures, GAMES } from '../../fixtures';
import { OtherGamesBar } from './OtherGamesBar';

const nowMs = Date.parse(db.meta.snapshotTime);
const board = fixtures.scoreboard();

const meta = {
  title: 'Organisms/OtherGamesBar',
  component: OtherGamesBar,
  args: {
    games: board.games,
    currentGameId: GAMES.liveQ4,
    nowMs,
    getHref: (id: string) => `#/game/${id}`,
  },
  decorators: [(Story) => <div className="mx-auto max-w-3xl"><Story /></div>],
} satisfies Meta<typeof OtherGamesBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The real Saturday slate: live games first, then upcoming, then final. */
export const Default: Story = {};
export const CurrentIsUpcoming: Story = { args: { currentGameId: GAMES.scheduled } };
export const CurrentIsFinal: Story = { args: { currentGameId: GAMES.final } };
/** Slate frozen in the morning, before any game starts: only upcoming chips (start times). */
export const PregameSlate: Story = {
  args: {
    games: board.games.map((g) => ({ ...g, status: 'scheduled' as const, clock: null, home: { ...g.home, score: null, periodScores: [] }, away: { ...g.away, score: null, periodScores: [] } })),
    nowMs: nowMs - 12 * 3_600_000,
  },
};
export const OnlyFinal: Story = { args: { games: board.games.filter((g) => g.status === 'final') } };
export const Empty: Story = { args: { games: [] } };
export const Loading: Story = { args: { loading: true } };
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};
export const Narrow320: Story = { decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>] };
