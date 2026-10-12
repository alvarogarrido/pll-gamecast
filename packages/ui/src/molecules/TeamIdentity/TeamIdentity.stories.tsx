import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { TeamIdentity } from './TeamIdentity';

const game = fixtures.game(GAMES.liveQ4);
const unranked = fixtures.game(GAMES.finalBlowout);

const meta = {
  title: 'Molecules/TeamIdentity',
  component: TeamIdentity,
  args: { team: game.away.team, rank: game.away.rank, record: game.away.record, layout: 'inline', size: 'md', side: 'away' },
  argTypes: {
    layout: { control: 'inline-radio', options: ['inline', 'stacked'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    side: { control: 'inline-radio', options: ['away', 'home'] },
    nameStyle: { control: 'inline-radio', options: ['school', 'abbreviation', 'full'] },
  },
} satisfies Meta<typeof TeamIdentity>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
export const Stacked: Story = { args: { layout: 'stacked', nameStyle: 'abbreviation' } };
export const Unranked: Story = { args: { team: unranked.away.team, rank: null, record: unranked.away.record } };
export const WithoutRecord: Story = { args: { record: undefined } };

/** Away left, home right: the two sides mirror around the score. */
export const MirroredInline: Story = {
  render: (args) => (
    <div className="flex max-w-md items-center justify-between gap-4 rounded-md border border-border-default bg-surface-card p-4">
      <TeamIdentity {...args} />
      <TeamIdentity {...args} team={game.home.team} rank={game.home.rank} record={game.home.record} side="home" />
    </div>
  ),
};

export const MirroredStacked: Story = {
  args: { layout: 'stacked', nameStyle: 'abbreviation' },
  render: (args) => (
    <div className="flex max-w-md items-center justify-between gap-4 rounded-md border border-border-default bg-surface-card p-4">
      <TeamIdentity {...args} />
      <span className="font-display text-score font-extrabold">{game.away.score} - {game.home.score}</span>
      <TeamIdentity {...args} team={game.home.team} rank={game.home.rank} record={game.home.record} side="home" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-end gap-8">
          <TeamIdentity {...args} size={size} layout="inline" />
          <TeamIdentity {...args} size={size} layout="stacked" nameStyle="abbreviation" />
        </div>
      ))}
    </div>
  ),
};

export const LongNameTruncates: Story = {
  args: { nameStyle: 'full', team: { ...game.home.team, school: 'Massachusetts Institute of Lacrosse' } },
  render: (args) => (
    <div className="w-48 rounded-md border border-border-default p-2">
      <TeamIdentity {...args} />
    </div>
  ),
};
