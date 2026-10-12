import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card/Card';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  args: { variant: 'text' },
  argTypes: { variant: { control: 'inline-radio', options: ['text', 'rect', 'circle'] } },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { variant: 'text', className: 'w-48' } };
export const Rect: Story = { args: { variant: 'rect', className: 'h-24 w-full' } };
export const Circle: Story = { args: { variant: 'circle' } };

export const ScoreboardPlaceholder: Story = {
  render: () => (
    <Card aria-busy="true" aria-label="Loading game">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="size-14" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton variant="circle" className="size-14" />
        </div>
      </div>
    </Card>
  ),
};
