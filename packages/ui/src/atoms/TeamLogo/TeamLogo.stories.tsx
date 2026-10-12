import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeamLogo } from './TeamLogo';

// Inline SVG data URI so the story needs no network.
const demoLogo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#003087"/><path d="M14 40 32 12l18 28z" fill="#fff"/></svg>',
  );

const meta = {
  title: 'Atoms/TeamLogo',
  component: TeamLogo,
  args: { src: demoLogo, name: 'Duke Blue Devils', abbreviation: 'DUKE', size: 'lg' },
  argTypes: { size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl', 'fill'] } },
} satisfies Meta<typeof TeamLogo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {};

export const MissingSrcFallsBackToMonogram: Story = { args: { src: null, color: '#003087' } };

export const BrokenSrcFallsBackToMonogram: Story = {
  args: { src: 'https://invalid.invalid/missing.png', color: '#CC0000', name: 'Maryland Terrapins', abbreviation: 'UMD' },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[demoLogo, null].map((src, row) => (
        <div key={row} className="flex items-end gap-4">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <TeamLogo key={size} {...args} src={src} size={size} color="#003087" />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const MonogramWithoutAbbreviation: Story = {
  args: { src: null, abbreviation: undefined, name: 'Notre Dame Fighting Irish' },
};

/** Navy rings on the dark card: each ring is lightened to 3:1 contrast (`border-team-primary-on-dark`), hue kept. */
export const NavyTeamsOnDark: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {[
        ['Notre Dame', 'ND', '#0C2340'],
        ['Duke', 'DUKE', '#003087'],
        ['Penn State', 'PSU', '#041E42'],
        ['Virginia', 'UVA', '#232D4B'],
        ['Maryland', 'UMD', '#E03A3E'],
      ].map(([name, abbreviation, color]) => (
        <TeamLogo key={name} {...args} src={null} name={name!} abbreviation={abbreviation} color={color} size="lg" />
      ))}
    </div>
  ),
};

/** `fill` takes its parent's size: the desktop Header Bar sets 88px (72px when tight) on a wrapper. */
export const FillsParent: Story = {
  args: { size: 'fill' },
  render: (args) => (
    <div className="flex items-end gap-4">
      <div className="size-22">
        <TeamLogo {...args} />
      </div>
      <div className="size-18">
        <TeamLogo {...args} src={null} color="#003087" />
      </div>
    </div>
  ),
};
