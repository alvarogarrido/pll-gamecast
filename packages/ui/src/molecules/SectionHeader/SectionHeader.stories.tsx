import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '../../atoms/Chip';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  args: { title: 'Top performers' },
  argTypes: { level: { control: 'inline-radio', options: [2, 3, 4] } },
} satisfies Meta<typeof SectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = { args: { title: 'Summary' } };
export const WithChevronLink: Story = { args: { href: '#top-performers', actionLabel: 'View all top performers' } };
export const WithChevronButton: Story = { args: { title: 'Team stats', onClick: () => {}, actionLabel: 'Open team stats' } };
export const WithActionSlot: Story = {
  args: {
    title: 'Insights',
    action: (
      <button type="button" className="rounded-pill focus-visible:outline-offset-2">
        <Chip tone="neutral">Button</Chip>
      </button>
    ),
  },
};
