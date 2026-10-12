import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../atoms/Card';
import { fixtures, GAMES } from '../../fixtures';
import { periodLabel, clock } from '../../lib/format';
import { Disclosure } from './Disclosure';

const meta = {
  title: 'Molecules/Disclosure',
  component: Disclosure,
  args: { title: 'Q1', summary: '3-2', children: 'Play list goes here.' },
  argTypes: { headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5] } },
  decorators: [
    (Story) => (
      <Card padding="none" className="mx-auto max-w-md overflow-hidden">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof Disclosure>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const OpenByDefault: Story = { args: { defaultOpen: true } };

export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" className="m-3 rounded-sm bg-surface-chip px-3 py-1 text-footnote" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Open'} from outside
        </button>
        <Disclosure {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

/** Play-by-play periods from the live fixture, latest period first and open. */
export const PlayByPlayPeriods: Story = {
  render: () => {
    const { plays } = fixtures.plays(GAMES.liveQ4);
    const periods = [...new Set(plays.map((p) => p.period))].sort((a, b) => b - a);
    return (
      <>
        {periods.map((period, i) => {
          const inPeriod = plays.filter((p) => p.period === period && p.type !== 'period_start' && p.type !== 'period_end');
          const last = inPeriod[inPeriod.length - 1];
          return (
            <Disclosure
              key={period}
              title={periodLabel(period)}
              summary={last ? `${last.awayScore}-${last.homeScore}` : undefined}
              defaultOpen={i === 0}
            >
              <ul className="flex flex-col gap-2 px-4 pb-4">
                {[...inPeriod].reverse().slice(0, 6).map((p) => (
                  <li key={p.id} className="flex gap-2 text-footnote">
                    <span className="w-10 shrink-0 tabular-nums text-text-secondary">{clock(p.clockSeconds)}</span>
                    <span>{p.description}</span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          );
        })}
      </>
    );
  },
};
