import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { ArticleCarousel } from './ArticleCarousel';

const NOW = Date.parse('2027-03-13T14:00:00Z');

/** Articles of several games stand in for "other relevant articles". */
const articles = [GAMES.final, GAMES.finalBlowout, GAMES.scheduled, GAMES.ncaa, GAMES.liveQ4, GAMES.scheduledIndoor].flatMap(
  (id) => fixtures.media(id).articles,
);

const meta = {
  title: 'Organisms/ArticleCarousel',
  component: ArticleCarousel,
  args: { articles, nowMs: NOW },
  argTypes: { layout: { control: 'inline-radio', options: ['carousel', 'list'] } },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof ArticleCarousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Carousel: Story = {};
export const OneArticle: Story = { args: { articles: articles.slice(0, 1) } };
/** Vertical list (Highlights tab). */
export const List: Story = { args: { layout: 'list' } };
export const Empty: Story = { args: { articles: [] } };
export const Loading: Story = { args: { loading: true } };
export const NarrowColumn: Story = { decorators: [(Story) => <div className="w-96"><Story /></div>] };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
export const MobileList: Story = { ...Mobile, args: { layout: 'list' } };
