import type { ReactNode } from 'react';
import { tokenList, tokens, type TokenEntry } from '@pll/tokens';

/**
 * Renderers for the "Foundations/Tokens" docs page (Tokens.mdx).
 * Everything comes from `@pll/tokens` (dist/tokens.ts, generated from the DTCG JSON), so the page cannot drift:
 * add or change a token, run `npm run tokens`, and it shows up here. Swatches paint with the real CSS variables,
 * labels print the resolved values.
 */

const paint = (entry: TokenEntry) => `var(${entry.cssVar})`;
const byPrefix = (prefix: string) => tokenList.filter((t) => t.path.startsWith(prefix));
const label = (path: string, strip: string) => path.slice(strip.length);

/** `sb-unstyled` opts out of Storybook's docs typography, so the tokens' own fonts and colors apply. */
function Root({ children }: { children: ReactNode }) {
  return <div className="sb-unstyled font-sans text-text-primary">{children}</div>;
}

function Code({ children }: { children: ReactNode }) {
  return <code className="text-caption text-text-tertiary">{children}</code>;
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-8 text-title3 uppercase text-text-primary">{children}</h3>;
}

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-4';

/* ----------------------------------------------------------------------------------------------- colors */

function Swatch({ entry, name }: { entry: TokenEntry; name: string }) {
  // Alpha tokens read as "#RRGGBB @ n%"; everything else prints its resolved value.
  const base = entry.alpha !== null ? tokenList.find((t) => t.path === entry.ref) : undefined;
  const value =
    entry.alpha !== null && base
      ? `${String(base.value).toUpperCase()} @ ${Math.round(entry.alpha * 100)}%`
      : String(entry.value).toUpperCase();
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="h-16 rounded-sm border border-border-default bg-surface-card p-0">
        <div className="size-full rounded-sm" style={{ background: paint(entry) }} />
      </div>
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-footnote font-semibold text-text-primary">{name}</span>
        <span className="text-footnote tabular-nums text-text-secondary">{value}</span>
        {entry.ref && <Code>{`→ ${entry.ref}`}</Code>}
        {entry.runtimeVar && <Code>{`${entry.runtimeVar} (fallback shown)`}</Code>}
        {entry.utility && <Code>{entry.utility}</Code>}
      </figcaption>
    </figure>
  );
}

const SEMANTIC_GROUPS: { title: string; match: (path: string) => boolean }[] = [
  { title: 'Surface', match: (p) => p.startsWith('color.surface.') },
  { title: 'Border', match: (p) => p.startsWith('color.border.') },
  { title: 'Text', match: (p) => p.startsWith('color.text.') },
  { title: 'Accent', match: (p) => p.startsWith('color.accent.') },
  { title: 'Status and link', match: (p) => p.startsWith('color.status.') || p === 'color.link' },
  { title: 'Tints (10% alpha)', match: (p) => /^color\.(live|gold|negative)\.tint$/.test(p) },
  { title: 'Team (runtime, neutral fallback)', match: (p) => p.startsWith('color.team.') },
];

export function ColorSwatches() {
  return (
    <Root>
      <div>
        {SEMANTIC_GROUPS.map((group) => (
          <section key={group.title}>
            <SubHeading>{group.title}</SubHeading>
            <div className={grid}>
              {tokenList
                .filter((t) => group.match(t.path))
                .map((t) => (
                  <Swatch key={t.path} entry={t} name={label(t.path, 'color.')} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </Root>
  );
}

export function PaletteSwatches() {
  return (
    <Root>
      <div className={grid}>
        {byPrefix('palette.').map((t) => (
          <Swatch key={t.path} entry={t} name={t.path} />
        ))}
      </div>
    </Root>
  );
}

/* ----------------------------------------------------------------------------------------------- type */

const familyName = (stack: string) => (stack.split(',')[0] ?? '').replace(/['"]/g, '').trim();

export function TypeScale() {
  return (
    <Root>
      <div className="flex flex-col divide-y divide-border-hairline rounded-md border border-border-default bg-surface-card">
        {Object.entries(tokens.text).map(([style, spec]) => {
          const prefix = `text.${style}.`;
          const size = tokenList.find((t) => t.path === `${prefix}fontSize`);
          const family = familyName(spec.fontFamily);
          const strong = 'fontWeightStrong' in spec ? spec.fontWeightStrong : null;
          const weights = strong ? `${spec.fontWeight}/${strong}` : `${spec.fontWeight}`;
          const sample = family === 'Barlow Condensed' ? '21 – 14 · 12:45' : 'Maryland at Duke, 3rd quarter';
          const css = (prop: string) => {
            const entry = tokenList.find((t) => t.path === `${prefix}${prop}`);
            return entry ? paint(entry) : undefined;
          };
          return (
            <div key={style} className="grid items-center gap-x-6 gap-y-2 p-4 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-0.5">
                <span className="text-footnote font-semibold text-text-primary">{`text.${style}`}</span>
                <span className="text-footnote tabular-nums text-text-secondary">
                  {`${spec.fontSize.replace('px', '')}/${spec.lineHeight.replace('px', '')} · ${weights} · ${family}`}
                </span>
                <span className="text-caption text-text-tertiary">{`letter-spacing ${spec.letterSpacing}`}</span>
                {size?.utility && <Code>{size.utility}</Code>}
              </div>
              <p
                className="m-0 truncate text-text-primary"
                style={{
                  fontFamily: css('fontFamily'),
                  fontSize: css('fontSize'),
                  lineHeight: css('lineHeight'),
                  fontWeight: css('fontWeight'),
                  letterSpacing: css('letterSpacing'),
                  fontVariantNumeric: 'fontVariantNumeric' in spec ? spec.fontVariantNumeric : undefined,
                }}
              >
                {sample}
              </p>
            </div>
          );
        })}
      </div>
    </Root>
  );
}

export function FontFamilies() {
  return (
    <Root>
      <div className={grid}>
        {byPrefix('font.family.').map((t) => (
          <div key={t.path} className="flex flex-col gap-1 rounded-md border border-border-default bg-surface-card p-4">
            <span className="text-footnote font-semibold text-text-primary">{t.path}</span>
            <span className="text-title1" style={{ fontFamily: paint(t) }}>
              Aa 0123
            </span>
            <Code>{t.utility}</Code>
            <span className="text-caption text-text-tertiary">{String(t.value)}</span>
          </div>
        ))}
      </div>
    </Root>
  );
}

/* ----------------------------------------------------------------------------------------------- radius, spacing, elevation */

export function Radii() {
  return (
    <Root>
      <div className="flex flex-wrap items-end gap-6">
        {byPrefix('radius.').map((t) => (
          <figure key={t.path} className="m-0 flex flex-col gap-2">
            <div
              className="h-16 w-24 border border-border-default bg-surface-raised"
              style={{ borderRadius: paint(t) }}
            />
            <figcaption className="flex flex-col gap-0.5">
              <span className="text-footnote font-semibold text-text-primary">{label(t.path, 'radius.')}</span>
              <span className="text-footnote tabular-nums text-text-secondary">{String(t.value)}</span>
              <Code>{t.utility}</Code>
            </figcaption>
          </figure>
        ))}
      </div>
    </Root>
  );
}

export function Spacing() {
  return (
    <Root>
      <div className="flex flex-col gap-3">
        {byPrefix('spacing.').map((t) => (
          <div key={t.path} className="grid grid-cols-[48px_72px_1fr] items-center gap-4">
            <span className="text-footnote font-semibold text-text-primary">{label(t.path, 'spacing.')}</span>
            <span className="text-footnote tabular-nums text-text-secondary">{String(t.value)}</span>
            <div className="flex items-center gap-4">
              <div className="h-4 rounded-xs bg-accent-gold" style={{ width: paint(t) }} />
              <Code>{t.utility?.replace('p-', 'p/m/gap-')}</Code>
            </div>
          </div>
        ))}
      </div>
    </Root>
  );
}

export function Elevation() {
  return (
    <Root>
      <div className="flex flex-wrap gap-6">
        {byPrefix('elevation.').map((t) => (
          <figure key={t.path} className="m-0 flex flex-col gap-3">
            <div className="h-20 w-48 rounded-md bg-surface-card" style={{ boxShadow: paint(t) }} />
            <figcaption className="flex flex-col gap-0.5">
              <span className="text-footnote font-semibold text-text-primary">{t.path}</span>
              <span className="text-footnote tabular-nums text-text-secondary">{String(t.value)}</span>
              <Code>{t.utility}</Code>
            </figcaption>
          </figure>
        ))}
      </div>
    </Root>
  );
}
