import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { MediaImage } from './MediaImage';

const media = fixtures.media(GAMES.final);
const imageUrl = media.articles.find((a) => a.imageUrl)?.imageUrl ?? null;
const thumbnailUrl = media.videos[0]?.thumbnailUrl ?? null;

const meta = {
  title: 'Atoms/MediaImage',
  component: MediaImage,
  args: { src: imageUrl },
  decorators: [(Story) => <div className="max-w-xs"><Story /></div>],
} satisfies Meta<typeof MediaImage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A real article image from the dataset (the media placeholders are served at /media). */
export const Default: Story = {};
export const VideoThumbnail: Story = { args: { src: thumbnailUrl, placeholderIcon: 'highlights' } };
/** No image (`null`): the placeholder tile with the default field icon. */
export const NoImage: Story = { args: { src: null } };
export const PlaceholderIcons: Story = {
  args: { src: null },
  render: (args) => (
    <div className="grid grid-cols-2 gap-3">
      <MediaImage {...args} />
      <MediaImage {...args} placeholderIcon="highlights" />
    </div>
  ),
};
/** A URL that fails to load falls back to the placeholder too. */
export const BrokenUrl: Story = { args: { src: '/media/does-not-exist.jpg' } };
export const Sized: Story = {
  render: (args) => (
    <div className="flex items-start gap-3 rounded-sm bg-surface-track p-2">
      <MediaImage {...args} className="w-28 shrink-0" />
      <p className="min-w-0 text-subhead font-semibold text-text-primary">Fixed-width thumbnail next to a title</p>
    </div>
  ),
};
