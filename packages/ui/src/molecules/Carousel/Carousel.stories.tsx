import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { MediaImage } from '../../atoms/MediaImage';
import { Card } from '../../atoms/Card';
import { SectionHeader } from '../SectionHeader';
import { Carousel, CarouselControls, CarouselRail, useCarousel } from './Carousel';

const videos = [GAMES.final, GAMES.finalBlowout, GAMES.liveQ4, GAMES.finalOvertime].flatMap((id) => fixtures.media(id).videos).slice(0, 8);

const Items = ({ count = videos.length }: { count?: number }) =>
  videos.slice(0, count).map((v) => (
    <li key={v.id} className="w-64 shrink-0 snap-start">
      <div className="flex flex-col gap-2 rounded-sm bg-surface-track p-2">
        <MediaImage src={v.thumbnailUrl} placeholderIcon="highlights" />
        <span className="line-clamp-2 min-h-10 text-subhead font-semibold text-text-primary">{v.title}</span>
      </div>
    </li>
  ));

const meta = {
  title: 'Molecules/Carousel',
  component: Carousel,
  args: { label: 'Videos', controlsLabel: 'videos', children: <Items /> },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Self-contained: controls above a scroll-snap rail. */
export const Default: Story = {};
/** Everything fits, so both buttons are disabled. */
export const FewItems: Story = { args: { children: <Items count={1} /> } };

function WithHeader() {
  const carousel = useCarousel();
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader
        title="Highlights"
        action={<CarouselControls canPrev={carousel.canPrev} canNext={carousel.canNext} onPrev={carousel.prev} onNext={carousel.next} label="videos" />}
      />
      <CarouselRail label="Highlights" carousel={carousel}>
        <Items />
      </CarouselRail>
    </Card>
  );
}

/** The composition the organisms use: `useCarousel` + `CarouselRail` in the body, `CarouselControls` in the section header. */
export const ControlsInSectionHeader: Story = { render: () => <WithHeader /> };

export const Mobile: Story = {
  globals: { viewport: { value: 'phone375' } },
  parameters: { viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } } },
};
