import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { NetworkBadge } from './NetworkBadge';

const meta = {
  title: 'Atoms/NetworkBadge',
  component: NetworkBadge,
  args: { network: 'ESPN2', variant: 'white', height: 16 },
  argTypes: { variant: { control: 'inline-radio', options: ['white', 'color'] } },
} satisfies Meta<typeof NetworkBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Logo: Story = {};
export const TextChip: Story = { args: { network: 'ACC Network' } };

export const KnownLogos: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['white', 'color'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          {['ESPN', 'ESPN+', 'ESPN2', 'ABC', 'ESPN App'].map((n) => (
            <NetworkBadge key={n} {...args} network={n} variant={variant} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const TextFallbacks: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {['ACC Network', 'Big Ten Network', 'B1G+', 'FS1', 'Peacock', 'Some Regional Sports Net'].map((n) => (
        <NetworkBadge key={n} {...args} network={n} />
      ))}
    </div>
  ),
};

/** Every broadcast on today's real slate. */
export const FromFixtures: Story = {
  render: (args) => {
    const networks = [...new Set(fixtures.scoreboard().games.flatMap((g) => g.broadcasts.map((b) => b.network)))];
    const live = fixtures.game(GAMES.liveQ4).broadcasts.map((b) => b.network);
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {networks.map((n) => (
            <NetworkBadge key={n} {...args} network={n} />
          ))}
        </div>
        <p className="text-footnote text-text-secondary">Live game: {live.join(', ')}</p>
      </div>
    );
  },
};
