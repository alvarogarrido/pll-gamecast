import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Atoms/Card',
  component: Card,
  args: { children: 'Card content', tone: 'card', padding: 'md', bordered: true },
  argTypes: {
    tone: { control: 'inline-radio', options: ['card', 'raised', 'track'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Nested rows drop the border. */
export const Borderless: Story = { args: { tone: 'raised', bordered: false } };

export const Tones: Story = {
  render: (args) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['card', 'raised', 'track'] as const).map((tone) => (
        <Card key={tone} {...args} tone={tone}>
          <p className="text-headline">{tone}</p>
          <p className="text-callout text-text-secondary">Surface token</p>
        </Card>
      ))}
    </div>
  ),
};

export const Nested: Story = {
  render: () => (
    <Card padding="md">
      <h3 className="mb-3 text-title3 uppercase">Key team stats</h3>
      <div className="flex flex-col gap-2">
        {['Shots', 'Ground balls', 'Turnovers'].map((label) => (
          <Card key={label} tone="track" padding="sm" bordered={false} className="flex justify-between">
            <span className="text-headline">{label}</span>
            <span className="text-headline tabular-nums">24</span>
          </Card>
        ))}
      </div>
    </Card>
  ),
};

export const AsSection: Story = { args: { as: 'section', 'aria-label': 'Example section' } };
