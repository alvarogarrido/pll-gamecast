import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, tabPanelProps, type TabItem } from './Tabs';

const sections: TabItem[] = [
  { value: 'gamecast', label: 'Gamecast' },
  { value: 'stats', label: 'Stats' },
  { value: 'plays', label: 'Plays' },
  { value: 'highlights', label: 'Highlights' },
];

const meta = {
  title: 'Atoms/Tabs',
  component: Tabs,
  args: {
    items: sections,
    value: 'gamecast',
    ariaLabel: 'Game sections',
    onValueChange: () => {},
    fullWidth: false,
    size: 'md',
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  // Controlled component: every story keeps its own state.
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Tabs {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FullWidth: Story = { args: { fullWidth: true } };
export const Small: Story = { args: { size: 'sm' } };
export const WithDisabledItem: Story = {
  args: { items: sections.map((s) => (s.value === 'highlights' ? { ...s, disabled: true } : s)) },
};

/** Arrow keys / Home / End move between tabs; only the selected tab is in the Tab order. */
export const WithPanels: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex flex-col gap-4">
        <Tabs {...args} idBase="demo" fullWidth value={value} onValueChange={setValue} />
        {sections.map((s) => (
          <div key={s.value} hidden={s.value !== value} {...tabPanelProps('demo', s.value)}>
            <p className="text-body text-text-secondary">Panel: {s.label}</p>
          </div>
        ))}
      </div>
    );
  },
};
