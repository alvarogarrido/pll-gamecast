import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { availabilityFor, SectionSelector, sectionPanelProps, type GamecastSection } from './SectionSelector';

const meta = {
  title: 'Organisms/SectionSelector',
  component: SectionSelector,
  args: { value: 'gamecast', onChange: () => {}, fullWidth: true, unavailable: 'disable' },
  argTypes: { unavailable: { control: 'inline-radio', options: ['disable', 'hide'] } },
  // Controlled component: each story keeps its own state.
  render: (args) => {
    const [value, setValue] = useState<GamecastSection>(args.value);
    return <SectionSelector {...args} value={value} onChange={setValue} />;
  },
  decorators: [(Story) => <div className="mx-auto max-w-xl"><Story /></div>],
} satisfies Meta<typeof SectionSelector>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Live and final games: everything available. */
export const Live: Story = { args: { available: availabilityFor('live') } };
export const Final: Story = { args: { value: 'highlights', available: availabilityFor('final') } };
/** Pregame: Highlights hidden, Stats and Plays greyed out. */
export const Pregame: Story = { args: { available: availabilityFor('pre') } };
/** Pregame, unavailable sections removed instead of greyed out. */
export const PregameHidden: Story = { args: { available: availabilityFor('pre'), unavailable: 'hide' } };
export const NaturalWidth: Story = { args: { fullWidth: false } };

export const Mobile320: Story = {
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

/** Arrow keys, Home and End move between tabs; the panel is wired with `sectionPanelProps`. */
export const WithPanels: Story = {
  render: (args) => {
    const [value, setValue] = useState<GamecastSection>('gamecast');
    return (
      <div className="flex flex-col gap-4">
        <SectionSelector {...args} idBase="sections" value={value} onChange={setValue} />
        {(['gamecast', 'stats', 'plays', 'highlights'] as const).map((s) => (
          <div key={s} hidden={s !== value} {...sectionPanelProps('sections', s)}>
            <p className="text-callout text-text-secondary">Panel: {s}</p>
          </div>
        ))}
      </div>
    );
  },
};
