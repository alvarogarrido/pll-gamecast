import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../atoms/Card';
import { fixtures, GAMES } from '../../fixtures';
import { SectionHeader } from '../SectionHeader';
import { ComparisonRow } from './ComparisonRow';

const meta = {
  title: 'Molecules/ComparisonRow',
  component: ComparisonRow,
  args: { label: 'Shots', away: 43, home: 50 },
  argTypes: {
    format: { control: 'inline-radio', options: ['number', 'pct', 'decimal'] },
    highlight: { control: 'inline-radio', options: ['auto', 'away', 'home', 'none'] },
  },
  decorators: [
    (Story) => (
      <Card className="mx-auto max-w-sm">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof ComparisonRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HomeLeads: Story = {};
export const AwayLeads: Story = { args: { away: 13, home: 8, label: 'Scores' } };
export const Tie: Story = { args: { away: 21, home: 21, label: 'Turnovers' } };
export const Percent: Story = { args: { label: 'Faceoff %', away: 0.433, home: 0.567, format: 'pct' } };
export const LowerIsBetter: Story = { args: { label: 'Turnovers', away: 14, home: 21, lowerIsBetter: true } };
export const CustomDisplay: Story = { args: { label: 'Power Play', away: 0, home: 0.667, awayDisplay: '0 of 4', homeDisplay: '2 of 3' } };
export const MissingValue: Story = { args: { away: null, home: 12 } };

/** The Team Stats "Overview" card, built from the live Duke at Notre Dame fixture. */
export const OverviewFromFixtures: Story = {
  render: () => {
    const game = fixtures.game(GAMES.liveQ4);
    const { teams } = fixtures.stats(GAMES.liveQ4);
    const a = teams.find((t) => t.teamId === game.away.team.id)!;
    const h = teams.find((t) => t.teamId === game.home.team.id)!;
    const names = { awayName: game.away.team.school, homeName: game.home.team.school };
    return (
      <>
        <SectionHeader level={3} title={`${game.away.team.abbreviation} vs ${game.home.team.abbreviation}`} />
        <ComparisonRow {...names} label="Goals" away={a.goals} home={h.goals} />
        <ComparisonRow {...names} label="Shots" away={a.shots} home={h.shots} />
        <ComparisonRow {...names} label="Shooting %" away={a.shotPct} home={h.shotPct} format="pct" />
        <ComparisonRow {...names} label="Turnovers" away={a.turnovers} home={h.turnovers} lowerIsBetter />
        <ComparisonRow {...names} label="Faceoff %" away={a.faceoffPct} home={h.faceoffPct} format="pct" />
        <ComparisonRow {...names} label="Save %" away={a.savePct} home={h.savePct} format="pct" />
        <ComparisonRow {...names} label="Penalties" away={a.penalties} home={h.penalties} lowerIsBetter />
      </>
    );
  },
};
