import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  args: { children: 'ACC', tone: 'neutral', size: 'md' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'outline', 'accent', 'gold', 'live', 'positive', 'negative', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {(['neutral', 'outline', 'accent', 'gold', 'live', 'positive', 'negative', 'link'] as const).map((tone) => (
        <Chip key={tone} {...args} tone={tone}>
          {tone}
        </Chip>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Chip {...args} size="sm">Small</Chip>
      <Chip {...args} size="md">Medium</Chip>
    </div>
  ),
};

export const WithLeading: Story = {
  args: { tone: 'outline', leading: <span aria-hidden="true">●</span>, children: 'Conference game' },
};
