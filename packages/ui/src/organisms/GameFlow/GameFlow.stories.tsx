import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { GameFlow } from './GameFlow';

const FINAL_OT = '8d07bac4-b313-4fd4-ab59-cb4ac3753693';

/** Game and plays of one fixture game, optionally frozen at `elapsed` game-seconds. */
function of(id: string, elapsed?: number) {
  const game = elapsed === undefined ? fixtures.game(id) : fixtures.at(id, elapsed).game();
  const { plays, playerRefs } = elapsed === undefined ? fixtures.plays(id) : fixtures.at(id, elapsed).plays();
  return { game, plays, playerRefs };
}

const meta = {
  title: 'Organisms/GameFlow',
  component: GameFlow,
  args: of(GAMES.liveQ4),
  decorators: [(Story) => <div className="mx-auto max-w-xl"><Story /></div>],
} satisfies Meta<typeof GameFlow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Tied 12-12 in Q4, four rows, the latest goal outlined in gold. */
export const LiveQ4: Story = {};
export const LiveQ2: Story = { args: of(GAMES.liveQ2) };
/** Just after the opening faceoff: one row, few goals. */
export const EarlyQ1: Story = { args: of(GAMES.liveQ4, 420) };
/** Frozen at the half. */
export const Halftime: Story = { args: of(GAMES.liveQ4, 1800) };
export const Final: Story = { args: of(GAMES.final) };
export const FinalBlowout: Story = { args: of(GAMES.finalBlowout) };
/** A fifth period adds an OT row. */
export const FinalOvertime: Story = { args: of(FINAL_OT) };
/** No plays loaded (or the feed has no goals): empty lanes and "No goals yet". */
export const LiveNoGoals: Story = { args: { ...of(GAMES.liveQ4, 300), plays: [] } };
export const Pregame: Story = { args: of(GAMES.scheduled) };
export const Loading: Story = { args: { loading: true } };
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};
export const Narrow320: Story = { decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>] };
export const Column380: Story = { args: of(GAMES.final), decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>] };
