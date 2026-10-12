import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { PlayByPlay } from './PlayByPlay';
import { PlayRow } from './PlayRow';

const meta = {
  title: 'Organisms/PlayByPlay',
  component: PlayByPlay,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayByPlay>;
export default meta;
type Story = StoryObj<typeof meta>;

function data(id: string, elapsed?: number) {
  const game = elapsed === undefined ? fixtures.game(id) : fixtures.at(id, elapsed).game();
  const { plays, playerRefs } = elapsed === undefined ? fixtures.plays(id) : fixtures.at(id, elapsed).plays();
  return { game, plays, playerRefs };
}

/** Live Q4: newest period first and open, newest play first. */
export const LiveQ4: Story = { args: data(GAMES.liveQ4) };

/** Live in Q2: only two periods exist yet. */
export const LiveQ2: Story = { args: data(GAMES.liveQ2) };

/** Final: chronological by default, with the "Newest first / Oldest first" toggle. */
export const Final: Story = { args: data(GAMES.final) };

export const FinalBlowout: Story = { args: data(GAMES.finalBlowout) };

/** A real overtime game (period 5 in the play log). */
export const Overtime: Story = { args: data('ee5f4e88-0c5d-42b3-a919-424d2f406bd4') };

export const GoalsOnly: Story = { args: { ...data(GAMES.final), defaultFilter: 'goals' } };
export const Penalties: Story = { args: { ...data(GAMES.final), defaultFilter: 'penalties' } };

/** Pregame: no plays yet. */
export const Pregame: Story = { args: { ...data(GAMES.scheduled), plays: [], playerRefs: [] } };

/** A moment right after tip-off: a single period with a handful of plays. */
export const JustStarted: Story = { args: data(GAMES.liveQ4, 240) };

export const Loading: Story = { args: { ...data(GAMES.final), loading: true } };

export const Mobile: Story = {
  args: data(GAMES.liveQ4),
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[375px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** The three row looks side by side: goal card, micro row, divider. */
export const Rows: Story = {
  args: data(GAMES.final),
  render: (args) => {
    const pick = (type: string) => args.plays.find((p) => p.type === type)!;
    const saved = args.plays.find((p) => p.type === 'shot' && p.details.shotResult === 'saved')!;
    return (
      <ul className="flex flex-col gap-2">
        {[pick('period_start'), pick('goal'), saved, pick('turnover'), pick('penalty'), pick('faceoff')].map((p) => (
          <PlayRow key={p.id} play={p} game={args.game} playerRefs={args.playerRefs} />
        ))}
      </ul>
    );
  },
};
