import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StatusGame } from '../../lib/format';
import { fixtures, GAMES } from '../../fixtures';
import { GameStatusLabel } from './GameStatusLabel';

// Server time of the snapshot, so the stories are deterministic.
const snapshotMs = Date.parse(fixtures.game(GAMES.liveQ4).startTime) + 3457 * 1000;

const liveQ4 = fixtures.game(GAMES.liveQ4);
const final = fixtures.game(GAMES.final);
const scheduled = fixtures.game(GAMES.scheduled);
const nowForScheduled = Date.parse(scheduled.startTime) - (2 * 60 + 5) * 60_000;

const live = (period: number, clockSeconds: number, phase: 'in_progress' | 'break' | 'halftime'): StatusGame => ({
  ...liveQ4,
  status: 'live',
  clock: { period, clockSeconds, phase },
});

const meta = {
  title: 'Molecules/GameStatusLabel',
  component: GameStatusLabel,
  args: { game: liveQ4, nowMs: snapshotMs, variant: 'pill' },
  argTypes: { variant: { control: 'inline-radio', options: ['pill', 'stacked', 'text'] } },
} satisfies Meta<typeof GameStatusLabel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Final: Story = { args: { game: final } };
export const Scheduled: Story = { args: { game: scheduled, nowMs: nowForScheduled } };

const cases: { name: string; game: StatusGame; nowMs: number }[] = [
  { name: 'Live Q3', game: live(3, 491, 'in_progress'), nowMs: snapshotMs },
  { name: 'End of Q1', game: live(1, 0, 'break'), nowMs: snapshotMs },
  { name: 'Halftime', game: live(2, 0, 'halftime'), nowMs: snapshotMs },
  { name: 'Live overtime', game: live(5, 143, 'in_progress'), nowMs: snapshotMs },
  { name: 'Final', game: final, nowMs: snapshotMs },
  { name: 'Final/OT', game: { ...final, home: { periodScores: [1, 2, 2, 3, 1] }, away: { periodScores: [2, 2, 2, 2, 0] } }, nowMs: snapshotMs },
  { name: 'Starts in 2h 5m', game: scheduled, nowMs: nowForScheduled },
  { name: '3 days out', game: scheduled, nowMs: Date.parse(scheduled.startTime) - 3 * 86_400_000 },
  { name: 'Far away', game: scheduled, nowMs: Date.parse(scheduled.startTime) - 20 * 86_400_000 },
  { name: 'Delayed', game: { ...scheduled, status: 'delayed' }, nowMs: nowForScheduled },
];

export const AllStates: Story = {
  render: (args) => (
    <table className="text-footnote">
      <tbody>
        {cases.map((c) => (
          <tr key={c.name}>
            <th scope="row" className="py-1 pr-6 text-left font-normal text-text-tertiary">{c.name}</th>
            {(['pill', 'stacked', 'text'] as const).map((variant) => (
              <td key={variant} className="px-3 py-1 align-middle">
                <GameStatusLabel {...args} game={c.game} nowMs={c.nowMs} variant={variant} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const OtherTimeZone: Story = {
  args: { game: scheduled, nowMs: Date.parse(scheduled.startTime) - 3 * 86_400_000, variant: 'text', timeZone: 'America/Los_Angeles' },
};
