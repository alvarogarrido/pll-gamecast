import type { Meta, StoryObj } from '@storybook/react-vite';
import { db, fixtures, GAMES } from '../../fixtures';
import { HeaderBar } from './HeaderBar';

/** Server time of the fixture snapshot (what `meta.serverTime` would be). */
const nowMs = Date.parse(db.meta.snapshotTime);

/** A final game that went to overtime (not in `GAMES`; found in the simulated season). */
const FINAL_OT = '8d07bac4-b313-4fd4-ab59-cb4ac3753693';

const meta = {
  title: 'Organisms/HeaderBar',
  component: HeaderBar,
  args: { game: fixtures.game(GAMES.scheduled), nowMs, variant: 'full' },
  argTypes: { variant: { control: 'inline-radio', options: ['full', 'minimized'] } },
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) => (parameters.wide ? <Story /> : <div className="mx-auto max-w-xl"><Story /></div>),
  ],
} satisfies Meta<typeof HeaderBar>;
export default meta;
type Story = StoryObj<typeof meta>;

const halftime = fixtures.at(GAMES.liveQ4, 1800).game();
const liveQ2 = fixtures.game(GAMES.liveQ2);
const liveQ4 = fixtures.game(GAMES.liveQ4);
const final = fixtures.game(GAMES.final);

// ---- Full ----------------------------------------------------------------

/** Within 12 hours of kickoff: date, time and a countdown. Venue and weather below. */
export const Pregame: Story = { args: { game: fixtures.game(GAMES.scheduled) } };
/** More than 12 hours out: no countdown. */
export const PregameDayBefore: Story = {
  args: { game: fixtures.game(GAMES.scheduled), nowMs: nowMs - 20 * 3_600_000 },
};
/** Indoor venue: weather reads "Indoor" or is hidden. */
export const PregameIndoor: Story = { args: { game: fixtures.game(GAMES.scheduledIndoor) } };
/** Neutral site, seeds and the "NCAA Quarterfinal" event label. */
export const NcaaNeutral: Story = { args: { game: fixtures.game(GAMES.ncaa) } };
export const LiveQ2: Story = { args: { game: liveQ2 } };
export const LiveQ4Tied: Story = { args: { game: liveQ4 } };
export const Halftime: Story = { args: { game: halftime } };
/** Winner in white, loser in secondary; rank and RPI movement under each team. */
export const Final: Story = { args: { game: final } };
/** D13: rank / RPI that did not move after the game show nothing, no "=" indicator. Only real movement shows. */
export const FinalNoMovement: Story = {
  args: {
    game: {
      ...final,
      away: { ...final.away, rankChange: 0, rpiChange: 0 },
      home: { ...final.home, rankChange: 0, rpiChange: 0 },
    },
  },
};
export const FinalBlowout: Story = { args: { game: fixtures.game(GAMES.finalBlowout) } };
/** Fifth period: an OT column joins the linescore and the status reads FINAL/OT. */
export const FinalOvertime: Story = { args: { game: fixtures.game(FINAL_OT) } };

// ---- Minimized -----------------------------------------------------------

export const MinimizedPregame: Story = { args: { variant: 'minimized', game: fixtures.game(GAMES.scheduled) } };
export const MinimizedLive: Story = { args: { variant: 'minimized', game: liveQ4 } };
export const MinimizedHalftime: Story = { args: { variant: 'minimized', game: halftime } };
/** D14: the minimized score uses the `score.sm` type token (24/24 Barlow 800). */
export const MinimizedFinal: Story = { args: { variant: 'minimized', game: final } };

/** Every state stacked, as the page would pin them at the top of the viewport. */
export const MinimizedAllStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[fixtures.game(GAMES.scheduled), liveQ4, halftime, final].map((game) => (
        <HeaderBar key={`${game.id}-${game.status}`} {...args} game={game} variant="minimized" />
      ))}
    </div>
  ),
};

// ---- Sizes and states ----------------------------------------------------

const at = (width: number) => (Story: () => React.ReactElement) => (
  // Fixed-width frame to mimic a phone or a desktop column; inline because it is demo scaffolding.
  <div style={{ width }} className="mx-auto">
    <Story />
  </div>
);

/** 375px phone, full header, live. */
export const Mobile: Story = {
  args: { game: liveQ4 },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [at(375)],
};
/** 320px, the smallest supported width. */
export const Narrow320: Story = { args: { game: liveQ4 }, decorators: [at(320)] };
export const MobileMinimized: Story = {
  args: { game: liveQ4, variant: 'minimized' },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [at(375)],
};
export const MobilePregame: Story = { args: { game: fixtures.game(GAMES.ncaa) }, decorators: [at(375)] };
/** Desktop left column (40%). */
export const Column380: Story = { args: { game: final }, decorators: [at(380)] };
/** Desktop right column (60%). */
export const Column580: Story = { args: { game: final }, decorators: [at(580)] };

// ---- Desktop band (D22): container >= 1024px ------------------------------

/** Desktop stories fill the canvas: the width is the frame (`at`), not the 36rem column the other stories use. */
const desktop = (width: number): Pick<Story, 'parameters' | 'decorators'> => ({ parameters: { layout: 'fullscreen', wide: true }, decorators: [at(width)] });

/** Pregame: date, kickoff and countdown in the middle, an en dash for each score, win-probability split and facts in the strip. */
export const Desktop1200Pregame: Story = { args: { game: fixtures.game(GAMES.scheduled) }, ...desktop(1200) };
/** Live, Duke at Notre Dame tied in Q4: green LIVE dot over the clock, linescore left, facts right. */
export const Desktop1200Live: Story = { args: { game: liveQ4 }, ...desktop(1200) };
export const Desktop1200Halftime: Story = { args: { game: halftime }, ...desktop(1200) };
/** Final: the loser's score is dimmed, "Cornell won by 3", rank / RPI movement under the winner's meta line (D13). */
export const Desktop1200Final: Story = { args: { game: final }, ...desktop(1200) };
/** An OT column joins the linescore and the status reads FINAL/OT. */
export const Desktop1200FinalOvertime: Story = { args: { game: fixtures.game(FINAL_OT) }, ...desktop(1200) };
/** Seed in the meta line and the event label (plus "Neutral site") above the date. */
export const Desktop1200NcaaNeutral: Story = { args: { game: fixtures.game(GAMES.ncaa) }, ...desktop(1200) };
/** The comfortable width the proposal was drawn at, with a long NCAA label on a live game. */
export const Desktop1200NcaaLive: Story = { args: { game: { ...liveQ4, label: 'NCAA Quarterfinal' } }, ...desktop(1200) };

/**
 * The tightest width the band supports (1024px), with the longest names: "Notre Dame" / "Fighting Irish" and "Johns Hopkins".
 * The logo shrinks to 72px and the columns tighten; the mascot and meta lines truncate before anything overflows.
 */
export const Desktop1024: Story = {
  args: { game: liveQ4 },
  ...desktop(1024),
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[liveQ4, liveQ2, final].map((game) => (
        <HeaderBar key={game.id} {...args} game={game} />
      ))}
    </div>
  ),
};

/** One pixel under the breakpoint: the stacked layout of narrower containers stays as it was. */
export const Desktop1023: Story = { args: { game: liveQ4 }, ...desktop(1023) };

export const Loading: Story = { args: { loading: true } };
/** The minimized bar at 320px, the smallest supported width. */
export const MinimizedNarrow320: Story = { args: { game: liveQ4, variant: 'minimized' }, decorators: [at(320)] };
export const LoadingMinimized: Story = { args: { loading: true, variant: 'minimized' } };
export const NoGame: Story = { args: { game: null } };
