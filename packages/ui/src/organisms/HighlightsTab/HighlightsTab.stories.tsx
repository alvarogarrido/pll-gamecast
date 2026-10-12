import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { HighlightsTab } from './HighlightsTab';

const NOW = Date.parse('2027-03-13T14:00:00Z');
const final = fixtures.media(GAMES.final);
const blowout = fixtures.media(GAMES.finalBlowout);

const meta = {
  title: 'Organisms/HighlightsTab',
  component: HighlightsTab,
  args: { videos: final.videos, articles: final.articles, nowMs: NOW },
  argTypes: { articleLayout: { control: 'inline-radio', options: ['list', 'carousel'] } },
  decorators: [(Story) => <div className="max-w-3xl"><Story /></div>],
} satisfies Meta<typeof HighlightsTab>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Final: Story = {};
export const Blowout: Story = { args: { videos: blowout.videos, articles: blowout.articles } };
export const ArticleCarouselLayout: Story = { args: { articleLayout: 'carousel' } };
export const VideosOnly: Story = { args: { articles: [] } };
export const NoMedia: Story = { args: { videos: [], articles: [] } };
export const Loading: Story = { args: { loading: true } };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
