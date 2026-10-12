import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { PlayerIdentity } from './PlayerIdentity';

const game = fixtures.game(GAMES.liveQ4);
const { playerRefs } = fixtures.stats(GAMES.liveQ4);
const awayPlayer = playerRefs.find((p) => p.teamId === game.away.team.id)!;
const homePlayer = playerRefs.find((p) => p.teamId === game.home.team.id)!;

const meta = {
  title: 'Molecules/PlayerIdentity',
  component: PlayerIdentity,
  args: { player: awayPlayer, teamColor: game.away.team.colors.primary, layout: 'inline', side: 'away', size: 'md', showMeta: true },
  argTypes: {
    layout: { control: 'inline-radio', options: ['inline', 'stacked'] },
    side: { control: 'inline-radio', options: ['away', 'home'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    avatarFallback: { control: 'inline-radio', options: ['silhouette', 'initials'] },
  },
} satisfies Meta<typeof PlayerIdentity>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
export const Stacked: Story = { args: { layout: 'stacked' } };
export const InitialsFallback: Story = { args: { avatarFallback: 'initials' } };
export const CustomMetaLine: Story = { args: { meta: '2A, 5PTS' } };
export const NameOnly: Story = { args: { showMeta: false } };

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center pt-1">
    <span className="font-display text-score tabular-nums text-text-primary">{value}</span>
    <span className="text-caption text-text-secondary">{label}</span>
  </div>
);

/** `trailing` puts a stat (or an action) on the outer edge; the identity keeps the rest of the width. */
export const WithTrailingStat: Story = {
  args: { layout: 'stacked', trailing: <Stat value="6" label="Goals" />, className: 'max-w-xs' },
};
export const WithTrailingStatMirrored: Story = {
  args: { layout: 'stacked', side: 'home', player: homePlayer, teamColor: game.home.team.colors.primary, trailing: <Stat value="4" label="Goals" />, className: 'max-w-xs' },
};
export const InlineWithTrailing: Story = {
  args: { trailing: <span className="font-display text-score tabular-nums text-text-primary">12</span>, className: 'max-w-xs' },
};

export const MirroredInline: Story = {
  render: (args) => (
    <div className="flex max-w-md items-center justify-between gap-4 rounded-md border border-border-default bg-surface-card p-4">
      <PlayerIdentity {...args} />
      <PlayerIdentity {...args} player={homePlayer} teamColor={game.home.team.colors.primary} side="home" />
    </div>
  ),
};

export const MirroredStacked: Story = {
  args: { layout: 'stacked' },
  render: (args) => (
    <div className="flex max-w-md justify-between gap-4 rounded-md border border-border-default bg-surface-card p-4">
      <PlayerIdentity {...args} />
      <PlayerIdentity {...args} player={homePlayer} teamColor={game.home.team.colors.primary} side="home" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <PlayerIdentity key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
