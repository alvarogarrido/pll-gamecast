import type { Meta, StoryObj } from '@storybook/react-vite';
import { db, fixtures, GAMES } from '../../fixtures';
import { GameChip } from './GameChip';

const nowMs = Date.parse(db.meta.snapshotTime);

const meta = {
  title: 'Molecules/GameChip',
  component: GameChip,
  args: { game: fixtures.game(GAMES.liveQ4), href: '#/game', nowMs, current: false },
  decorators: [(Story) => <ul className="flex flex-wrap gap-2"><Story /></ul>],
} satisfies Meta<typeof GameChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const LiveCurrent: Story = { args: { current: true } };
export const Upcoming: Story = { args: { game: fixtures.game(GAMES.scheduled) } };
export const Final: Story = { args: { game: fixtures.game(GAMES.final) } };
export const FinalOvertime: Story = { args: { game: fixtures.game(GAMES.finalOvertime) } };
export const UnrankedTeams: Story = { args: { game: fixtures.game(GAMES.finalBlowout) } };

/** The whole Saturday slate side by side. */
export const Slate: Story = {
  render: (args) => (
    <>
      {fixtures.scoreboard().games.slice(0, 6).map((g) => (
        <GameChip key={g.id} {...args} game={g} current={g.id === GAMES.liveQ4} />
      ))}
    </>
  ),
};

/** `renderLink` swaps the `<a>` for a router link: all props, including the class names and aria attributes, go to it. */
export const CustomLink: Story = {
  args: {
    renderLink: (props) => (
      <a {...props} data-router-link="" onClick={(e) => e.preventDefault()}>
        {props.children}
      </a>
    ),
  },
};
