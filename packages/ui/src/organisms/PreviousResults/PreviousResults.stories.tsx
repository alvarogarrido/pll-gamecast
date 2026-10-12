import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { PreviousResults } from './PreviousResults';

const scheduled = fixtures.game(GAMES.scheduled);
const scheduledPreview = fixtures.preview(GAMES.scheduled);
const ncaa = fixtures.game(GAMES.ncaa);
const ncaaPreview = fixtures.preview(GAMES.ncaa);
const indoor = fixtures.game(GAMES.scheduledIndoor);
const indoorPreview = fixtures.preview(GAMES.scheduledIndoor);

const meta = {
  title: 'Organisms/PreviousResults',
  component: PreviousResults,
  args: { previousResults: scheduledPreview.previousResults, game: scheduled },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof PreviousResults>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pregame: Story = {};
export const Indoor: Story = { args: { previousResults: indoorPreview.previousResults, game: indoor } };
export const Ncaa: Story = { args: { previousResults: ncaaPreview.previousResults, game: ncaa } };

/** Early season: one team has played, the other has not. */
export const OneTeamWithoutGames: Story = {
  args: { previousResults: { away: scheduledPreview.previousResults.away, home: [] } },
};
export const Empty: Story = { args: { previousResults: { away: [], home: [] } } };
export const Loading: Story = { args: { loading: true } };

/** Desktop column of about 380px (the 40% column). */
export const NarrowColumn: Story = {
  decorators: [(Story) => <div className="w-96"><Story /></div>],
};

/** Below 20rem the two columns stack. */
export const VeryNarrowStacked: Story = {
  decorators: [(Story) => <div className="w-72"><Story /></div>],
};

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
