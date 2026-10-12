import type { Meta, StoryObj } from '@storybook/react-vite';
import { LiveDot } from './LiveDot';

const meta = {
  title: 'Atoms/LiveDot',
  component: LiveDot,
  args: { size: 'md', pulse: true },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
} satisfies Meta<typeof LiveDot>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Static: Story = { args: { pulse: false } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4 text-footnote font-semibold text-status-live">
      <span className="inline-flex items-center gap-1"><LiveDot {...args} size="sm" /> LIVE</span>
      <span className="inline-flex items-center gap-1"><LiveDot {...args} size="md" /> LIVE</span>
    </div>
  ),
};
