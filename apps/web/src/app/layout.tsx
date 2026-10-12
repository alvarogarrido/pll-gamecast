import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import { tokens } from '@pll/tokens';
import { OfflineBanner } from '@/components/states/OfflineBanner';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: { default: 'NCAA Gamecast', template: '%s · NCAA Gamecast' },
  description: 'Live scores, stats and plays for NCAA lacrosse.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: tokens.color.surface.page,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppProviders>
          <OfflineBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
