import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { LatestPlays } from './LatestPlays';

const meta = {
  title: 'Organisms/LatestPlays',
  component: LatestPlays,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[380px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LatestPlays>;
export default meta;
type Story = StoryObj<typeof meta>;

const of = (id: string, elapsed?: number) => ({
  game: elapsed === undefined ? fixtures.game(id) : fixtures.at(id, elapsed).game(),
  ...(elapsed === undefined ? fixtures.plays(id) : fixtures.at(id, elapsed).plays()),
});

export const LiveQ4: Story = { args: { ...of(GAMES.liveQ4), onSeeAll: () => {} } };
export const LiveQ2: Story = { args: { ...of(GAMES.liveQ2), onSeeAll: () => {} } };
export const Final: Story = { args: { ...of(GAMES.final), seeAllHref: '#play-by-play' } };
export const ThreePlays: Story = { args: { ...of(GAMES.final), max: 3, onSeeAll: () => {} } };
export const Wide60Percent: Story = {
  args: { ...of(GAMES.liveQ4), onSeeAll: () => {} },
  decorators: [(Story) => <div className="mx-auto w-[580px] max-w-full"><Story /></div>],
};
export const Empty: Story = { args: { ...of(GAMES.scheduled), plays: [], playerRefs: [] } };
export const Loading: Story = { args: { ...of(GAMES.final), loading: true } };
export const Mobile: Story = {
  args: { ...of(GAMES.liveQ4), onSeeAll: () => {} },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
