import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { LiveInsights } from './LiveInsights';

const meta = {
  title: 'Organisms/LiveInsights',
  component: LiveInsights,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[380px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveInsights>;
export default meta;
type Story = StoryObj<typeof meta>;

const of = (id: string, elapsed?: number) => ({
  game: elapsed === undefined ? fixtures.game(id) : fixtures.at(id, elapsed).game(),
  insights: (elapsed === undefined ? fixtures.insights(id) : fixtures.at(id, elapsed).insights()).insights,
});

export const LiveQ4: Story = { args: of(GAMES.liveQ4) };
export const LiveQ2: Story = { args: of(GAMES.liveQ2) };
export const Final: Story = { args: of(GAMES.final) };

/** Only the latest insight, nothing older. */
export const SingleInsight: Story = {
  args: (() => {
    const a = of(GAMES.liveQ4);
    return { ...a, insights: a.insights.slice(-1) };
  })(),
};

export const EarlyGameEmpty: Story = { args: { ...of(GAMES.liveQ4, 0), insights: [] } };
export const Loading: Story = { args: { ...of(GAMES.liveQ4), loading: true } };

/** One of each kind, to review the icons. */
export const AllKinds: Story = {
  args: (() => {
    const a = of(GAMES.liveQ4);
    const kinds = ['run', 'streak', 'lead_change', 'milestone', 'record', 'drought', 'note'] as const;
    const base = a.insights[0]!;
    return {
      ...a,
      maxOlder: 7,
      insights: kinds.map((kind, i) => ({ ...base, id: `kind-${kind}`, kind, title: `${kind.replace('_', ' ')} insight`, elapsedSeconds: i * 100 })),
    };
  })(),
};

export const Mobile: Story = {
  args: of(GAMES.liveQ4),
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
