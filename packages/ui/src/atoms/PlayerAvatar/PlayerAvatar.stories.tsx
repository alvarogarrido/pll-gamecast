import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerAvatar } from './PlayerAvatar';

// Inline SVG data URI so the story needs no network (the demo dataset has no player photos).
const demoPhoto =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e8590c"/><circle cx="32" cy="26" r="11" fill="#f1c9a5"/><path d="M8 64a24 24 0 0 1 48 0z" fill="#fff"/></svg>',
  );

const meta = {
  title: 'Atoms/PlayerAvatar',
  component: PlayerAvatar,
  args: { photoUrl: demoPhoto, name: 'Brennan Dowd', color: '#003087', size: 'lg' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    fallback: { control: 'inline-radio', options: ['silhouette', 'initials'] },
  },
} satisfies Meta<typeof PlayerAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Photo: Story = {};
export const Silhouette: Story = { args: { photoUrl: null } };
export const Initials: Story = { args: { photoUrl: null, fallback: 'initials' } };
export const BrokenPhotoFallsBack: Story = { args: { photoUrl: 'https://invalid.invalid/missing.jpg', color: '#CC0000' } };
export const NoTeamColor: Story = { args: { photoUrl: null, color: undefined } };

export const SizesAndStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {([demoPhoto, null] as const).map((photoUrl) => (
        <div key={String(photoUrl)} className="flex items-end gap-4">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <PlayerAvatar key={size} {...args} photoUrl={photoUrl} size={size} />
          ))}
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <PlayerAvatar key={`i${size}`} {...args} photoUrl={null} fallback="initials" size={size} color="#CC0000" />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Navy rings on the dark card are lightened to 3:1 contrast, hue kept. */
export const NavyTeamsOnDark: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {['#0C2340', '#003087', '#041E42', '#232D4B', '#E03A3E'].map((color) => (
        <PlayerAvatar key={color} {...args} photoUrl={null} fallback="initials" color={color} />
      ))}
    </div>
  ),
};
