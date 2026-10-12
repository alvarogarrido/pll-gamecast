import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { GameStakes } from './GameStakes';

const scheduled = fixtures.game(GAMES.scheduled);
const ncaa = fixtures.game(GAMES.ncaa);
const indoor = fixtures.game(GAMES.scheduledIndoor);

const meta = {
  title: 'Organisms/GameStakes',
  component: GameStakes,
  args: { game: scheduled },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof GameStakes>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};
export const Indoor: Story = { args: { game: indoor } };
/** Tournament game: the event label shows as a gold chip. */
export const Ncaa: Story = { args: { game: ncaa } };
export const NoStakes: Story = { args: { game: { ...scheduled, stakes: null } } };
export const Loading: Story = { args: { loading: true } };

export const Mobile: Story = {
  args: { game: ncaa },
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
