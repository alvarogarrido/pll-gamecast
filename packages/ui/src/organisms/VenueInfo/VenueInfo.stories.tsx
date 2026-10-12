import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtures, GAMES } from '../../fixtures';
import { VenueInfo } from './VenueInfo';

const scheduled = fixtures.game(GAMES.scheduled);
const indoor = fixtures.game(GAMES.scheduledIndoor);
const ncaa = fixtures.game(GAMES.ncaa);
const final = fixtures.game(GAMES.final);
const live = fixtures.game(GAMES.liveQ4);

const meta = {
  title: 'Organisms/VenueInfo',
  component: VenueInfo,
  args: { game: live, variant: 'card' },
  argTypes: { variant: { control: 'inline-radio', options: ['card', 'inline'] } },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof VenueInfo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
/** Final game: the attendance shows when the API has it. */
export const FinalWithAttendance: Story = { args: { game: { ...final, attendance: final.attendance ?? 8421 } } };
export const Final: Story = { args: { game: final } };
/** Indoor (no weather). */
export const Indoor: Story = { args: { game: indoor } };
export const IndoorConditionWithTemperature: Story = {
  args: { game: { ...indoor, weather: { temperatureF: 68, condition: 'indoor', precipitationChance: null } } },
};
/** Neutral site (NCAA quarterfinal). */
export const NeutralSite: Story = { args: { game: ncaa } };
export const Rain: Story = { args: { game: { ...scheduled, weather: { temperatureF: 47, condition: 'rain', precipitationChance: 0.8 } } } };
export const NoPrecipitationChance: Story = {
  args: { game: { ...scheduled, weather: { temperatureF: 61, condition: 'partly_cloudy', precipitationChance: null } } },
};
export const Loading: Story = { args: { loading: true } };

/** Compact version for the pregame header. */
export const InlineOutdoor: Story = { args: { game: scheduled, variant: 'inline' } };
export const InlineIndoor: Story = { args: { game: indoor, variant: 'inline' } };
export const InlineNeutral: Story = { args: { game: ncaa, variant: 'inline' } };

export const Conditions: Story = {
  render: (args) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['clear', 'partly_cloudy', 'cloudy', 'rain', 'snow', 'wind'] as const).map((condition) => (
        <VenueInfo key={condition} {...args} game={{ ...scheduled, weather: { temperatureF: 50, condition, precipitationChance: 0.2 } }} />
      ))}
    </div>
  ),
  decorators: [(Story) => <div className="max-w-3xl"><Story /></div>],
};

export const Mobile: Story = {
  args: { game: ncaa },
  globals: { viewport: { value: 'phone375' } },
  parameters: {
    viewport: { options: { phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } } } },
  },
};
