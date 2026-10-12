import type { Meta, StoryObj } from '@storybook/react-vite';
import { db, fixtures, GAMES } from '../../fixtures';
import { WinProbabilityChart } from './WinProbabilityChart';

const meta = {
  title: 'Organisms/WinProbabilityChart',
  component: WinProbabilityChart,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[580px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WinProbabilityChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const of = (id: string) => ({ game: fixtures.game(id), series: fixtures.winProbability(id) });

/**
 * Story helper: find a finished game that went to overtime by scanning the fixture db plays for period >= 5
 * (the simulated season has two, both finals).
 */
function findOvertimeGameId(): string {
  const found = Object.entries(db.plays).find(
    ([gameId, log]) => db.games.find((g) => g.id === gameId)?.status === 'final' && (log as ReadonlyArray<{ period: number }>).some((p) => p.period >= 5),
  );
  if (!found) throw new Error('No overtime game in the fixtures');
  return found[0];
}

export const LiveQ4: Story = { args: of(GAMES.liveQ4) };
export const LiveQ2: Story = { args: of(GAMES.liveQ2) };
export const Final: Story = { args: of(GAMES.final) };
export const FinalBlowout: Story = { args: of(GAMES.finalBlowout) };
export const Overtime: Story = { args: of(findOvertimeGameId()) };
export const Pregame: Story = { args: of(GAMES.scheduled) };
export const NoPregameValue: Story = {
  args: (() => {
    const a = of(GAMES.scheduled);
    return { ...a, game: { ...a.game, winProbabilityHome: null }, series: { ...a.series, points: [] } };
  })(),
};
export const LiveNoPointsYet: Story = {
  args: (() => {
    const a = of(GAMES.liveQ4);
    return { ...a, series: { ...a.series, points: [] } };
  })(),
};
export const Loading: Story = { args: { ...of(GAMES.liveQ4), loading: true } };

/** Narrow desktop column (about 40%). */
export const Column380: Story = {
  args: of(GAMES.liveQ4),
  decorators: [(Story) => <div className="mx-auto w-[380px] max-w-full"><Story /></div>],
};

export const Mobile: Story = {
  args: of(GAMES.liveQ4),
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [(Story) => <div className="mx-auto w-[375px] max-w-full"><Story /></div>],
};

/** D15: a finished game's header says who won ("Duke won") instead of 100.0% / 0.0%. */
export const FinalResultHeader: Story = { args: of(GAMES.finalBlowout) };

/** D15: a live game that is all but decided still prints 99.9% / 0.1%, never a certainty. */
export const LiveNearCertain: Story = {
  args: (() => {
    const a = of(GAMES.liveQ4);
    const points = [...a.series.points];
    const last = points[points.length - 1];
    if (last) points[points.length - 1] = { ...last, home: 1 };
    return { ...a, series: { ...a.series, points } };
  })(),
};

/** D18: overtime is drawn at least 10% of the x axis wide, so "OT" and the sudden-victory end stay readable (here at 375px). */
export const OvertimeMobile: Story = {
  args: of(findOvertimeGameId()),
  decorators: [(Story) => <div className="mx-auto w-[375px] max-w-full"><Story /></div>],
};
