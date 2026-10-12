import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { ConferenceStandings } from './ConferenceStandings';

/** Yale at Princeton: both Ivy, one table. */
const sameConf = fixtures.game(GAMES.scheduled);
const sameConfStandings = fixtures.preview(GAMES.scheduled).standings;
/** Penn State vs Duke (NCAA): Big Ten and ACC, a selector. */
const crossConf = fixtures.game(GAMES.ncaa);
const crossConfStandings = fixtures.preview(GAMES.ncaa).standings;
const indoor = fixtures.game(GAMES.scheduledIndoor);
const indoorStandings = fixtures.preview(GAMES.scheduledIndoor).standings;

const meta = {
  title: 'Organisms/ConferenceStandings',
  component: ConferenceStandings,
  args: { standings: sameConfStandings, game: sameConf },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof ConferenceStandings>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Both teams share a conference: a single table, no selector. */
export const SameConference: Story = {};
/** Different conferences: the segmented control starts on the away team's. */
export const CrossConference: Story = { args: { standings: crossConfStandings, game: crossConf } };
export const Indoor: Story = { args: { standings: indoorStandings, game: indoor } };
export const Empty: Story = { args: { standings: [] } };
export const Loading: Story = { args: { loading: true } };

export const NarrowColumn: Story = {
  args: { standings: crossConfStandings, game: crossConf },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
};

export const Mobile: Story = {
  args: { standings: crossConfStandings, game: crossConf },
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
