import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GameStats, PlayerRef } from '@pll/data/api';
import { fixtures, GAMES } from '../../fixtures';
import { teamPairColors } from '../../lib/team-style';
import { Card } from '../../atoms/Card';
import { PlayerCompare, type PlayerCompareEntry } from './PlayerCompare';

const game = fixtures.game(GAMES.liveQ4);
const stats = fixtures.stats(GAMES.liveQ4);
const refs = new Map<string, PlayerRef>(stats.playerRefs.map((p) => [p.id, p]));

type Line = GameStats['data']['players'][number];
const best = (teamId: string, score: (l: Line) => number): Line =>
  stats.players.filter((l) => l.teamId === teamId).sort((a, b) => score(b) - score(a))[0]!;

const scorer = (teamId: string, color: string): PlayerCompareEntry => {
  const l = best(teamId, (x) => x.points * 100 + x.goals);
  return {
    player: refs.get(l.playerId)!,
    teamColor: color,
    primary: { value: String(l.goals), label: 'Goals' },
    secondary: [`${l.goals}/${l.shots} SH`, `${l.assists} A`, `${l.points} PTS`],
  };
};
const goalie = (teamId: string, color: string): PlayerCompareEntry => {
  const l = best(teamId, (x) => x.saves);
  return { player: refs.get(l.playerId)!, teamColor: color, primary: { value: String(l.saves), label: 'Saves' }, secondary: [`${l.goalsAgainst} GA`] };
};

const away = scorer(game.away.team.id, game.away.team.colors.primary);
const home = scorer(game.home.team.id, game.home.team.colors.primary);

const meta = {
  title: 'Molecules/PlayerCompare',
  component: PlayerCompare,
  args: { title: 'Scoring', away, home, awayName: game.away.team.school, homeName: game.home.team.school, emptyLabel: 'No scorer yet' },
  decorators: [
    (Story) => (
      <Card padding="md" className="mx-auto max-w-xl">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof PlayerCompare>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Away player left, category chip in the middle, home player right and mirrored (Duke at Notre Dame, live). */
export const Default: Story = {};
export const Goalie: Story = {
  args: { title: 'Goalie', away: goalie(game.away.team.id, game.away.team.colors.primary), home: goalie(game.home.team.id, game.home.team.colors.primary) },
};
export const OneSideEmpty: Story = { args: { home: null } };
export const BothEmpty: Story = { args: { away: null, home: null } };
export const NoSupportingStats: Story = { args: { away: { ...away, secondary: [] }, home: { ...home, secondary: [] } } };
/** Duke and Notre Dame are both navy: pass the pair colors so the avatar rings tell them apart on the dark card. */
export const PairColors: Story = { args: { teamColors: teamPairColors(game.away.team.colors, game.home.team.colors) } };
export const Stacked: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <PlayerCompare {...args} />
      <div className="border-t border-border-hairline pt-4">
        <PlayerCompare {...args} title="Goalie" away={goalie(game.away.team.id, game.away.team.colors.primary)} home={goalie(game.home.team.id, game.home.team.colors.primary)} />
      </div>
    </div>
  ),
};
export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: { viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } } },
  decorators: [(Story) => <div style={{ width: 343 }}><Story /></div>],
};
