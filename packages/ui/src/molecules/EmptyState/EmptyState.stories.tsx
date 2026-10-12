import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../atoms/Card';
import { fixtures, GAMES } from '../../fixtures';
import { EmptyState } from './EmptyState';
import { SectionHeader } from '../SectionHeader';

const meta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  args: { message: 'Play-by-play appears once the game starts.' },
  decorators: [
    (Story) => (
      <Card className="mx-auto max-w-sm">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MessageOnly: Story = {};
export const WithTitle: Story = { args: { title: 'No injuries reported', message: 'Both teams are healthy going into the game.', icon: 'plaster' } };
export const NoIcon: Story = { args: { icon: null } };
export const WithAction: Story = {
  args: { action: <button type="button" className="rounded-pill bg-surface-chip px-3 py-1 text-caption">Notify me</button> },
};

/** A real pregame module: the scheduled game has no plays yet. */
export const FromFixtures: Story = {
  render: () => {
    const { plays } = fixtures.plays(GAMES.scheduled);
    return (
      <>
        <SectionHeader title="Play-by-play" />
        {plays.length === 0 ? <EmptyState message="Play-by-play appears once the game starts." /> : <p>{plays.length} plays</p>}
      </>
    );
  },
};
