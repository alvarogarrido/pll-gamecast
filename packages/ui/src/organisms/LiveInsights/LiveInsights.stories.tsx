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

const of = (id: string, elapsed?: number) => {
  const data = elapsed === undefined ? fixtures.insights(id) : fixtures.at(id, elapsed).insights();
  return {
    game: elapsed === undefined ? fixtures.game(id) : fixtures.at(id, elapsed).game(),
    insights: data.insights,
    playerRefs: data.playerRefs,
  };
};

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

/** Player insights show the player's avatar (no photos in the fixtures, so the silhouette); team-level ones keep the team logo. */
export const PlayerAvatars: Story = { args: { ...of(GAMES.liveQ4), maxOlder: 8 } };

/** `playerRefs` left out: every insight falls back to its team logo. */
export const WithoutPlayerRefs: Story = { args: { ...of(GAMES.liveQ4), playerRefs: undefined } };

/** A player with a photo URL (a real one, or one that fails and falls back to the silhouette). */
export const WithPhoto: Story = {
  args: (() => {
    const a = of(GAMES.liveQ4);
    return {
      ...a,
      playerRefs: a.playerRefs.map((p) => ({
        ...p,
        photoUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#5b6b8c"/><circle cx="24" cy="19" r="9" fill="#d8dde8"/><path d="M6 48a18 18 0 0 1 36 0z" fill="#d8dde8"/></svg>')}`,
      })),
    };
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
