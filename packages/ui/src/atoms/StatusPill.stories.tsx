import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Atoms/StatusPill',
  component: StatusPill,
  args: { status: 'live', size: 'md' },
  argTypes: {
    status: { control: 'inline-radio', options: ['scheduled', 'live', 'final', 'halftime'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof StatusPill>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = { args: { status: 'live' } };
export const Scheduled: Story = { args: { status: 'scheduled' } };
export const Final: Story = { args: { status: 'final' } };
export const Halftime: Story = { args: { status: 'halftime' } };

export const AllStatuses: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill {...args} status="scheduled" />
      <StatusPill {...args} status="live" />
      <StatusPill {...args} status="halftime" />
      <StatusPill {...args} status="final" />
    </div>
  ),
};

export const WithCustomLabels: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill {...args} status="scheduled" label="Sat 7:00 PM" />
      <StatusPill {...args} status="live" label="Q3 4:12" />
      <StatusPill {...args} status="final" label="Final / OT" />
    </div>
  ),
};

export const Small: Story = { args: { size: 'sm' } };
