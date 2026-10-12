import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import { tokens } from '@pll/tokens';
import { OfflineBanner } from '@/components/states/OfflineBanner';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

// Fonts (design decision D4). The CSS variable names are what the font tokens look for:
// font.family.sans -> var(--font-inter), font.family.display -> var(--font-barlow-condensed).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '800'],
  display: 'swap',
  variable: '--font-barlow-condensed',
});

export const metadata: Metadata = {
  title: { default: 'NCAA Gamecast', template: '%s · NCAA Gamecast' },
  description: 'Live scores, stats and plays for NCAA lacrosse.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the page use the notch area; sticky bars pad themselves with env(safe-area-inset-top).
  viewportFit: 'cover',
  themeColor: tokens.color.surface.page,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>
        <AppProviders>
          <OfflineBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
