import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@pll/icons';
import { fixtures, GAMES } from '../../fixtures';
import { StatComparisonCard, type StatComparisonCardRow } from './StatComparisonCard';

const game = fixtures.game(GAMES.liveQ4);
const { teams } = fixtures.stats(GAMES.liveQ4);
const a = teams.find((t) => t.teamId === game.away.team.id)!;
const h = teams.find((t) => t.teamId === game.home.team.id)!;

const rows: StatComparisonCardRow[] = [
  { id: 'goals', label: 'Goals', away: a.goals, home: h.goals },
  { id: 'shots', label: 'Shots', away: a.shots, home: h.shots },
  { id: 'shotPct', label: 'Shooting %', away: a.shotPct, home: h.shotPct, format: 'pct' },
  { id: 'turnovers', label: 'Turnovers', away: a.turnovers, home: h.turnovers, lowerIsBetter: true },
  { id: 'faceoffPct', label: 'Faceoff %', away: a.faceoffPct, home: h.faceoffPct, format: 'pct' },
  { id: 'emo', label: 'Extra-man', away: a.extraManGoals, home: h.extraManGoals, awayDisplay: `${a.extraManGoals} of ${a.extraManOpportunities}`, homeDisplay: `${h.extraManGoals} of ${h.extraManOpportunities}` },
];

const meta = {
  title: 'Molecules/StatComparisonCard',
  component: StatComparisonCard,
  args: { title: 'Overview', away: game.away.team, home: game.home.team, rows },
  argTypes: { level: { control: 'inline-radio', options: [3, 4] } },
  decorators: [(Story) => <div className="mx-auto max-w-md"><Story /></div>],
} satisfies Meta<typeof StatComparisonCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Duke at Notre Dame, live: the better value of each row sits in a highlighted chip. */
export const Default: Story = {};
export const WithFooter: Story = {
  args: {
    title: 'Game',
    footer: (
      <button type="button" className="flex min-h-10 w-full items-center justify-center gap-1 border-t border-border-hairline text-footnote font-semibold text-link hover:text-text-primary">
        See all stats <Icon name="chevron-right" size={16} />
      </button>
    ),
  },
};
export const FewRows: Story = { args: { title: 'Season Avg', rows: rows.slice(0, 2) } };
export const MissingValues: Story = { args: { rows: rows.map((r) => ({ ...r, home: null })) } };
export const Heading4: Story = { args: { level: 4 } };
/** Team logos fall back to a ring monogram offline; Maryland at Johns Hopkins for another pair of colors. */
export const OtherGame: Story = {
  args: (() => {
    const g = fixtures.game(GAMES.liveQ2);
    return { away: g.away.team, home: g.home.team };
  })(),
};
export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: { viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } } },
};
