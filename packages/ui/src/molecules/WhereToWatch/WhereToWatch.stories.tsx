import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { WhereToWatch } from './WhereToWatch';

const meta = {
  title: 'Molecules/WhereToWatch',
  component: WhereToWatch,
  args: { broadcasts: fixtures.game(GAMES.liveQ4).broadcasts, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'sm'] } },
} satisfies Meta<typeof WhereToWatch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Real broadcasts of the live fixture game. */
export const Default: Story = {};
export const Linked: Story = {
  args: {
    broadcasts: [
      { network: 'ESPN2', url: 'https://example.com/watch' },
      { network: 'ESPN+', url: 'https://example.com/plus' },
    ],
  },
};
export const NetworkWithoutLogo: Story = { args: { broadcasts: [{ network: 'ACC Network', url: null }, { network: 'ESPN+', url: null }] } };
export const Many: Story = {
  args: { broadcasts: ['ESPN', 'ESPN2', 'ESPN+', 'ABC', 'ACC Network', 'Big Ten Network'].map((network) => ({ network, url: null })) },
};
/** Compact row for the pinned bar: small logos, at most three, no links. */
export const Compact: Story = { args: { size: 'sm', broadcasts: ['ESPN', 'ESPN+', 'ACC Network', 'ABC'].map((network) => ({ network, url: null })) } };
/** Nothing to show renders nothing. */
export const Empty: Story = { args: { broadcasts: [] } };
