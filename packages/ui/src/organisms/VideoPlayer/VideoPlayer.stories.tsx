import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { VideoPlayer } from './VideoPlayer';
import { nextVideo, orderVideos, previewVideo } from './video.logic';

const scheduledVideos = fixtures.media(GAMES.scheduled).videos;
const finalVideos = orderVideos(fixtures.media(GAMES.final).videos);
const ncaaVideos = fixtures.media(GAMES.ncaa).videos;

const meta = {
  title: 'Organisms/VideoPlayer',
  component: VideoPlayer,
  args: { video: previewVideo(scheduledVideos), heading: 'Game preview' },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof VideoPlayer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pregame preview: the thumbnail is a placeholder in Storybook, so the poster is dropped. */
export const Preview: Story = {};
/** Autoplays muted (PRD). Under `prefers-reduced-motion` it stays paused. */
export const Autoplay: Story = { args: { autoplay: true } };
/** Postgame video with a recommended next one: seek to the end of the clip to see "Up next". */
export const WithUpNext: Story = {
  args: {
    video: finalVideos[0],
    nextVideo: nextVideo(finalVideos, finalVideos[0]!.id),
    onSelectNext: () => {},
    heading: 'Highlights',
  },
};
export const NcaaPreview: Story = { args: { video: previewVideo(ncaaVideos) } };
export const NoVideo: Story = { args: { video: null } };
export const BrokenSource: Story = { args: { video: { ...previewVideo(scheduledVideos)!, src: 'https://invalid.example/missing.mp4' } } };
export const Unframed: Story = { args: { framed: false, heading: undefined } };
export const Loading: Story = { args: { loading: true } };

export const NarrowColumn: Story = { decorators: [(Story) => <div className="w-96"><Story /></div>] };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
