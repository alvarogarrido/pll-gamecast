import type { Preview } from '@storybook/react-vite';
import { themes } from 'storybook/theming';
import { tokens } from '@pll/tokens';
import '../src/styles.css';

const preview: Preview = {
  tags: ['autodocs'],
  // Dark by default (PLL theme). Switch from the toolbar's background menu.
  initialGlobals: { backgrounds: { value: 'page' } },
  parameters: {
    layout: 'padded',
    backgrounds: {
      options: {
        page: { name: 'Page', value: tokens.color.surface.page },
        nav: { name: 'Nav', value: tokens.color.surface.nav },
        card: { name: 'Card', value: tokens.color.surface.card },
      },
    },
    docs: { theme: themes.dark },
    controls: { matchers: { color: /(background|color)$/i } },
    options: {
      // Story title convention: Atoms/…, Molecules/…, Organisms/…
      storySort: { order: ['Atoms', 'Molecules', 'Organisms'] },
    },
  },
};

export default preview;
