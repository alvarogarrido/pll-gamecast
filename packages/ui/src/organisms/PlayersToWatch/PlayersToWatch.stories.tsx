import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { PlayersToWatch, PlayersToWatchSkeleton } from './PlayersToWatch';

const pre = (id: string) => ({ game: fixtures.game(id), preview: fixtures.preview(id) });

const meta = {
  title: 'Organisms/PlayersToWatch',
  component: PlayersToWatch,
  args: pre(GAMES.scheduled),
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayersToWatch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pregame: Story = {};
export const PregameIndoor: Story = { args: pre(GAMES.scheduledIndoor) };
export const Ncaa: Story = { args: pre(GAMES.ncaa) };
export const Loading: Story = { render: () => <PlayersToWatchSkeleton /> };
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[375px] max-w-full">
        <Story />
      </div>
    ),
  ],
};
