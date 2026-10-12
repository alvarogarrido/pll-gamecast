import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon, GoalIcon, NetworkLogo, iconNames, icons, multicolorIcons, networkIds, networkVariants } from '../src';

describe('icons', () => {
  it('exports a component for every icon name', () => {
    expect(iconNames.length).toBeGreaterThan(80);
    for (const name of iconNames) expect(typeof icons[name]).toBe('function');
  });

  it('renders every icon as a decorative 24px svg by default', () => {
    for (const name of iconNames) {
      const html = renderToStaticMarkup(<Icon name={name} />);
      expect(html, name).toContain('viewBox="0 0 24 24"');
      expect(html, name).toContain('width="24"');
      expect(html, name).toContain('aria-hidden="true"');
      expect(html, name).not.toContain('<title');
    }
  });

  it('honours size, title and svg props', () => {
    const html = renderToStaticMarkup(<GoalIcon size={32} title="Goal" className="text-red-500" />);
    expect(html).toContain('width="32"');
    expect(html).toContain('role="img"');
    expect(html).toContain('>Goal</title>');
    expect(html).toContain('class="text-red-500"');
    expect(html).not.toContain('aria-hidden');
  });

  it('only multicolor icons carry literal colours', () => {
    expect([...multicolorIcons].sort()).toEqual(['fire', 'fire-frozen', 'fire-frozen-empty']);
    for (const name of iconNames) {
      const html = renderToStaticMarkup(<Icon name={name} />);
      const hasLiteral = /(?:fill|stroke)="#[0-9a-f]{3,8}"/i.test(html);
      expect(hasLiteral, name).toBe((multicolorIcons as readonly string[]).includes(name));
    }
  });
});

describe('NetworkLogo', () => {
  it('renders every network in both variants, keeping real colours and aspect ratio', () => {
    for (const network of networkIds) {
      for (const variant of networkVariants) {
        const html = renderToStaticMarkup(<NetworkLogo network={network} variant={variant} />);
        expect(html, `${network}/${variant}`).toContain('height="16"');
        expect(html).not.toContain('currentColor');
      }
    }
    const espnColor = renderToStaticMarkup(<NetworkLogo network="espn" variant="color" height={32} title="ESPN" />);
    expect(espnColor).toContain('width="64"');
    expect(espnColor).toContain('#f51825');
    expect(espnColor).toContain('role="img"');
  });
});
