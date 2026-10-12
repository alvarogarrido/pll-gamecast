import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrendIndicator } from './TrendIndicator';

const meta = {
  title: 'Atoms/TrendIndicator',
  component: TrendIndicator,
  args: { change: 2, showValue: true, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, direction: { control: 'inline-radio', options: [undefined, 'up', 'down', 'equal'] } },
} satisfies Meta<typeof TrendIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Up: Story = { args: { change: 2 } };
export const Down: Story = { args: { change: -1 } };
export const Equal: Story = { args: { change: 0 } };
export const ArrowOnly: Story = { args: { showValue: false } };

export const AllStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['md', 'sm'] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <TrendIndicator {...args} size={size} change={3} />
          <TrendIndicator {...args} size={size} change={-2} />
          <TrendIndicator {...args} size={size} change={0} />
          <TrendIndicator {...args} size={size} change={null} />
        </div>
      ))}
    </div>
  ),
};
