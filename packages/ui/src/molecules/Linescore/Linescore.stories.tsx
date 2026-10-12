import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { Linescore } from './Linescore';

const meta = {
  title: 'Molecules/Linescore',
  component: Linescore,
  args: { game: fixtures.game(GAMES.liveQ4) },
  decorators: [(Story) => <div className="max-w-md rounded-md border border-border-default bg-surface-card p-4"><Story /></div>],
} satisfies Meta<typeof Linescore>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Live: the current period's heading is green. */
export const Live: Story = {};
export const Final: Story = { args: { game: fixtures.game(GAMES.final) } };
export const FinalBlowout: Story = { args: { game: fixtures.game(GAMES.finalBlowout) } };
/** Overtime adds an OT column. */
export const Overtime: Story = { args: { game: fixtures.game(GAMES.finalOvertime) } };
export const EarlyInTheGame: Story = { args: { game: fixtures.game(GAMES.liveQ2) } };
/** Before kickoff nothing is played: dashes and no total. */
export const Scheduled: Story = { args: { game: fixtures.game(GAMES.scheduled) } };
export const Narrow320: Story = { decorators: [(Story) => <div style={{ width: 288 }}><Story /></div>] };
