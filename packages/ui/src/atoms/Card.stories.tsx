import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Atoms/Card',
  component: Card,
  args: { children: 'Card content', tone: 'card', padding: 'md', bordered: false },
  argTypes: {
    tone: { control: 'inline-radio', options: ['card', 'scoreboard', 'row', 'rowRaised', 'rowSunken'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bordered: Story = { args: { bordered: true } };

export const Tones: Story = {
  render: (args) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['card', 'scoreboard', 'row', 'rowRaised', 'rowSunken'] as const).map((tone) => (
        <Card key={tone} {...args} tone={tone} bordered>
          <p className="text-stat-label">{tone}</p>
          <p className="text-body text-text-secondary">Surface token</p>
        </Card>
      ))}
    </div>
  ),
};

export const Nested: Story = {
  render: () => (
    <Card padding="md" bordered>
      <h3 className="mb-3 text-h2">Key team stats</h3>
      <div className="flex flex-col gap-2">
        {['Shots', 'Ground balls', 'Turnovers'].map((label) => (
          <Card key={label} tone="row" padding="sm" className="flex justify-between">
            <span className="text-stat-label">{label}</span>
            <span className="text-stat-label tabular-nums">24</span>
          </Card>
        ))}
      </div>
    </Card>
  ),
};

export const AsSection: Story = { args: { as: 'section', 'aria-label': 'Example section' } };
