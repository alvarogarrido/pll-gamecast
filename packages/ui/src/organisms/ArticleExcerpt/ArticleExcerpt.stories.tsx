import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { ArticleExcerpt } from './ArticleExcerpt';
import { featuredArticle } from './article.logic';

/** Server time of the snapshot slate (Sat 13 Mar 2027, morning ET). */
const NOW = Date.parse('2027-03-13T14:00:00Z');

const previewMedia = fixtures.media(GAMES.scheduled);
const ncaaMedia = fixtures.media(GAMES.ncaa);
const finalMedia = fixtures.media(GAMES.final);

const meta = {
  title: 'Organisms/ArticleExcerpt',
  component: ArticleExcerpt,
  args: { article: featuredArticle(previewMedia.articles, 'preview'), kind: 'preview', nowMs: NOW },
  argTypes: { kind: { control: 'inline-radio', options: ['preview', 'recap'] } },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof ArticleExcerpt>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pregame preview. The fixture's `keySentence` is cut off ("No"), so the pull quote falls back to the excerpt. */
export const Preview: Story = {};
export const PreviewNcaa: Story = { args: { article: featuredArticle(ncaaMedia.articles, 'preview') } };
/** Postgame recap. */
export const Recap: Story = { args: { article: featuredArticle(finalMedia.articles, 'recap'), kind: 'recap' } };
/** With a real image and an author photo (demo URLs). */
export const WithImageAndPhoto: Story = {
  args: {
    article: {
      ...featuredArticle(previewMedia.articles, 'preview')!,
      imageUrl: 'https://picsum.photos/id/1011/960/540',
      author: { ...featuredArticle(previewMedia.articles, 'preview')!.author, photoUrl: 'https://picsum.photos/id/1005/96/96' },
    },
  },
};
export const BrokenImage: Story = {
  args: { article: { ...featuredArticle(previewMedia.articles, 'preview')!, imageUrl: 'https://invalid.example/missing.jpg' } },
};
export const EmptyPreview: Story = { args: { article: null } };
export const EmptyRecap: Story = { args: { article: null, kind: 'recap' } };
export const Loading: Story = { args: { loading: true } };

export const NarrowColumn: Story = { decorators: [(Story) => <div className="w-96"><Story /></div>] };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
