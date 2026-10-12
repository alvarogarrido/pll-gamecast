import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { orderVideos } from '../VideoPlayer/video.logic';
import { HighlightsCarousel } from './HighlightsCarousel';

const NOW = Date.parse('2027-03-13T14:00:00Z');
/** Videos of several games stand in for a long list. */
const videos = orderVideos(
  [GAMES.final, GAMES.finalBlowout, GAMES.liveQ4, GAMES.liveQ2, GAMES.ncaa].flatMap((id) => fixtures.media(id).videos),
);
const finalVideos = orderVideos(fixtures.media(GAMES.final).videos);

const meta = {
  title: 'Organisms/HighlightsCarousel',
  component: HighlightsCarousel,
  args: { videos, nowMs: NOW, selectedId: videos[0]?.id },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof HighlightsCarousel>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Selecting a card moves the "Now playing" mark (the parent would load it into the player). */
export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string | null>(args.selectedId ?? null);
    return <HighlightsCarousel {...args} selectedId={selected} onSelect={(v) => setSelected(v.id)} />;
  },
};
export const Final: Story = { args: { videos: finalVideos, selectedId: finalVideos[0]?.id } };
export const Inert: Story = { args: { selectedId: null } };
export const Empty: Story = { args: { videos: [] } };
export const Loading: Story = { args: { loading: true } };
export const NarrowColumn: Story = { decorators: [(Story) => <div className="w-96"><Story /></div>] };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
