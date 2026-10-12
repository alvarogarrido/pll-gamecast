import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatValue } from './StatValue';

const meta = {
  title: 'Atoms/StatValue',
  component: StatValue,
  args: { children: '56.7%', highlighted: true, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof StatValue>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Highlighted: Story = {};
export const Plain: Story = { args: { highlighted: false, children: '43.3%' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <StatValue {...args} size="sm">14</StatValue>
      <StatValue {...args} size="md">14</StatValue>
    </div>
  ),
};

/** Leader and trailer share the same box, so numbers stay aligned down a column. */
export const AlignedColumn: Story = {
  render: (args) => (
    <div className="flex w-24 flex-col items-center gap-2">
      <StatValue {...args} highlighted>13</StatValue>
      <StatValue {...args} highlighted={false}>1,234</StatValue>
      <StatValue {...args} highlighted>2.5</StatValue>
    </div>
  ),
};
