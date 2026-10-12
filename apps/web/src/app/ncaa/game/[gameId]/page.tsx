import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GameScreen, GameScreenFallback } from '@/features/game/GameScreen';
import { getGameIdParams } from '@/lib/static-params';

// Static export: only ids returned by generateStaticParams exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return getGameIdParams();
}

export const metadata: Metadata = { title: 'Gamecast' };

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return (
    // The tab lives in the query string, which static export can only read on the client.
    <Suspense fallback={<GameScreenFallback />}>
      <GameScreen gameId={gameId} />
    </Suspense>
  );
}
