import type { Meta, StoryObj } from '@storybook/react-vite';
import { db } from '../fixtures';
import { teamColorOnDark, teamColorVars, teamPairColors } from '../lib/team-style';

/*
 * How team colors behave on the dark card (#1F1F1F): the raw API primary next to its `teamColorOnDark` value, and
 * the look-alike pairs resolved by `teamPairColors`. Data: the real teams of the dataset.
 */

const teams = db.teams as readonly { id: string; school: string; abbreviation: string; colors: { primary: string; secondary: string } }[];

const meta = {
  title: 'Foundations/Team colors on dark',
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-2">
    <span style={{ backgroundColor: color }} className="size-6 shrink-0 rounded-full border border-border-hairline" />
    <span className="font-mono text-caption text-text-secondary">{label}</span>
  </span>
);

/** Left: the primary as the API sends it. Right: `teamColorOnDark` (3:1 against surface.card, hue kept). */
export const RawVersusOnDark: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-2 rounded-md bg-surface-card p-4">
      {teams.map((t) => (
        <div key={t.id} className="grid grid-cols-[8rem_1fr_1fr] items-center gap-2 text-footnote text-text-primary">
          <span>{t.school}</span>
          <Swatch color={t.colors.primary} label={t.colors.primary} />
          <Swatch color={teamColorOnDark(t.colors.primary)} label={teamColorOnDark(t.colors.primary)} />
        </div>
      ))}
    </div>
  ),
};

const pairs: [string, string][] = [
  ['Duke', 'Notre Dame'],
  ['Penn State', 'Georgetown'],
  ['Penn', 'Yale'],
  ['Johns Hopkins', 'Duke'],
  ['Virginia', 'Notre Dame'],
  ['Maryland', 'Syracuse'],
  ['North Carolina', 'Duke'],
];
const bySchool = (school: string) => teams.find((t) => t.school === school)!;

/** Look-alike teams fall back to a secondary color; teams that already differ keep their (lightened) primaries. */
export const LookAlikePairs: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-3 rounded-md bg-surface-card p-4">
      {pairs.map(([awayName, homeName]) => {
        const away = bySchool(awayName);
        const home = bySchool(homeName);
        const pair = teamPairColors(away.colors, home.colors);
        return (
          <div key={awayName + homeName} className="grid grid-cols-1 items-center gap-1 text-footnote text-text-primary sm:grid-cols-2 sm:gap-3">
            <span className="flex min-w-0 items-center gap-2" style={teamColorVars(away.colors.primary, away.colors.secondary, pair.away)}>
              <span className="h-2 w-16 rounded-pill bg-team-primary-on-dark" />
              {awayName}
            </span>
            <span className="flex min-w-0 items-center gap-2" style={teamColorVars(home.colors.primary, home.colors.secondary, pair.home)}>
              <span className="h-2 w-16 rounded-pill bg-team-primary-on-dark" />
              {homeName}
              <span className="text-text-tertiary">{pair.home !== teamColorOnDark(home.colors.primary) ? '(secondary)' : ''}</span>
            </span>
          </div>
        );
      })}
    </div>
  ),
};
