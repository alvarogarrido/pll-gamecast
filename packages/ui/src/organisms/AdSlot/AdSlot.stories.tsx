import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdSlot } from './AdSlot';

const meta = {
  title: 'Organisms/AdSlot',
  component: AdSlot,
  args: { size: 'rectangle' },
  argTypes: { size: { control: 'inline-radio', options: ['skyscraper', 'rectangle', 'mobile-bar'] } },
} satisfies Meta<typeof AdSlot>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 300×250 */
export const Rectangle: Story = {};
/** 160×600, desktop outer column. */
export const Skyscraper: Story = { args: { size: 'skyscraper' } };
/** 320×50, mobile bottom bar. */
export const MobileBar: Story = { args: { size: 'mobile-bar' } };

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <AdSlot size="skyscraper" />
      <div className="flex flex-col gap-4">
        <AdSlot size="rectangle" />
        <AdSlot size="mobile-bar" />
      </div>
    </div>
  ),
};

/** Pinned to the bottom of a phone-width viewport. */
export const Mobile: Story = {
  args: { size: 'mobile-bar', pinned: true },
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};

/** At 320px wide the 320px bar must not overflow the page gutter. */
export const InNarrowContainer: Story = {
  args: { size: 'mobile-bar' },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
};
