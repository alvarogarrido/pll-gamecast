import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { teamPairColors } from '../../lib/team-style';
import { TeamScope } from './TeamScope';

const game = fixtures.game(GAMES.liveQ4);

const meta = {
  title: 'Molecules/TeamScope',
  component: TeamScope,
  args: { team: game.away.team },
} satisfies Meta<typeof TeamScope>;
export default meta;
type Story = StoryObj<typeof meta>;

const Swatches = () => (
  <div className="flex items-center gap-2 text-footnote">
    <span className="size-8 rounded-sm bg-team-primary" />
    <span className="size-8 rounded-sm bg-team-secondary" />
    <span className="border-b-4 border-team-primary pb-1 text-team-secondary">Primary border, secondary text</span>
  </div>
);

const OnDarkSwatches = () => (
  <div className="flex items-center gap-2 text-footnote">
    <span className="size-8 rounded-sm bg-team-primary" title="raw primary" />
    <span className="size-8 rounded-sm bg-team-primary-on-dark" title="on dark" />
    <span className="text-text-tertiary">raw primary, then primary-on-dark</span>
  </div>
);

export const Default: Story = { render: (args) => <TeamScope {...args}><Swatches /></TeamScope> };

export const BothTeamsAndFallback: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TeamScope team={game.away.team}><Swatches /></TeamScope>
      <TeamScope team={game.home.team}><Swatches /></TeamScope>
      <div>
        <p className="mb-1 text-caption text-text-tertiary">No scope: neutral token fallback</p>
        <Swatches />
      </div>
    </div>
  ),
};

export const Nested: Story = {
  render: () => (
    <TeamScope team={game.home.team} className="rounded-md border-2 border-team-primary p-4">
      <p className="mb-2 text-footnote text-text-secondary">{game.home.team.school}</p>
      <TeamScope team={game.away.team} className="rounded-md border-2 border-team-primary p-4">
        <p className="mb-2 text-footnote text-text-secondary">{game.away.team.school}, nested: the closest scope wins</p>
        <Swatches />
      </TeamScope>
    </TeamScope>
  ),
};

/** `bg-team-primary-on-dark` is the primary lightened to 3:1 on the card, so navy teams stay visible. */
export const PrimaryOnDark: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-md border border-border-default bg-surface-card p-4">
      <TeamScope team={game.away.team}><OnDarkSwatches /></TeamScope>
      <TeamScope team={game.home.team}><OnDarkSwatches /></TeamScope>
    </div>
  ),
};

/** Pass one half of `teamPairColors(away, home)` as `primaryOnDark` to keep two look-alike teams apart. */
export const PairOverride: Story = {
  render: () => {
    const pair = teamPairColors(game.away.team.colors, game.home.team.colors);
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border-default bg-surface-card p-4">
        <TeamScope team={game.away.team} primaryOnDark={pair.away}><OnDarkSwatches /></TeamScope>
        <TeamScope team={game.home.team} primaryOnDark={pair.home}><OnDarkSwatches /></TeamScope>
      </div>
    );
  },
};
