import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Icon,
  NetworkLogo,
  iconNames,
  multicolorIcons,
  networkIds,
  networkLabels,
  networkVariants,
  type IconName,
} from '@pll/icons';

const meta = {
  title: 'Foundations/Icons',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const isFilled = (n: IconName) => n.endsWith('-filled');
const isMulticolor = (n: IconName) => (multicolorIcons as readonly string[]).includes(n);

function IconTile({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-md border border-border-default bg-surface-card p-3 text-text-primary">
      <Icon name={name} size={size} />
      <code className="w-full break-words text-center text-caption text-text-secondary">{name}</code>
      {isMulticolor(name) && <span className="text-caption2 uppercase text-text-tertiary">multicolor</span>}
    </li>
  );
}

function Grid({ names, size }: { names: readonly IconName[]; size?: number }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2 p-0">
      {names.map((n) => (
        <IconTile key={n} name={n} size={size} />
      ))}
    </ul>
  );
}

/** Every exported icon, with its `IconName`. Regular / single-style first, then `-filled`. */
export const AllIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="m-0 text-footnote text-text-secondary">
        {iconNames.length} icons. Glyphs use <code>currentColor</code>; <code>-filled</code> marks the Filled style.
      </p>
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-subhead font-semibold text-text-primary">Regular / single style ({iconNames.filter((n) => !isFilled(n)).length})</h3>
        <Grid names={iconNames.filter((n) => !isFilled(n))} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-subhead font-semibold text-text-primary">Filled ({iconNames.filter(isFilled).length})</h3>
        <Grid names={iconNames.filter(isFilled)} />
      </section>
    </div>
  ),
};

/** Icons follow the surrounding text colour. */
export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {['text-text-primary', 'text-text-secondary', 'text-accent-gold', 'text-status-live', 'text-status-positive', 'text-link'].map((c) => (
        <span key={c} className={`flex items-center gap-2 ${c}`}>
          <Icon name="goal" title="Goal" size={32} />
          <Icon name="whistle" size={32} />
          <Icon name="trophy-filled" size={32} />
        </span>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 text-text-primary">
      {[16, 20, 24, 32, 48].map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <Icon name="lacrosse-head" size={s} />
          <code className="text-caption text-text-tertiary">{s}</code>
        </div>
      ))}
    </div>
  ),
};

/** `variant="white"` sits on `surface-card` (dark); `variant="color"` on `surface-raised`. Aspect ratio is preserved. */
export const NetworkLogos: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {networkVariants.map((variant) => (
        <section
          key={variant}
          className={`flex flex-col gap-3 rounded-md border border-border-default p-4 text-text-primary ${
            variant === 'white' ? 'bg-surface-card' : 'bg-surface-raised'
          }`}
        >
          <h3 className="m-0 text-subhead font-semibold">variant=&quot;{variant}&quot;</h3>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {networkIds.map((network) => (
              <li key={network} className="flex items-center gap-4">
                <span className="flex min-w-24 items-center">
                  <NetworkLogo network={network} variant={variant} height={24} title={networkLabels[network]} />
                </span>
                <code className="text-caption text-text-secondary">{network}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  ),
};
