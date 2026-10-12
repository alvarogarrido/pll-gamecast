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
        card: { name: 'Card', value: tokens.color.surface.card },
        raised: { name: 'Raised', value: tokens.color.surface.raised },
      },
    },
    docs: { theme: themes.dark },
    controls: { matchers: { color: /(background|color)$/i } },
    options: {
      // Story title convention: Foundations/…, Atoms/…, Molecules/…, Organisms/…
      storySort: { order: ['Foundations', 'Atoms', 'Molecules', 'Organisms'] },
    },
  },
};

export default preview;
