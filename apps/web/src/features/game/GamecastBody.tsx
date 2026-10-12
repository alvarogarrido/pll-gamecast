'use client';

import type { ReactNode } from 'react';
import { cn } from '@pll/ui';
import type { GamePhase } from './tabs';
import {
  ArticleModule,
  ConferenceStandingsModule,
  GameFlowModule,
  GameStakesModule,
  InjuryReportModule,
  KeyTeamStatsModule,
  LatestPlaysModule,
  LiveInsightsModule,
  PlayersToWatchModule,
  PostHighlightsModule,
  PreviewVideoModule,
  PreviousResultsModule,
  TopPerformersModule,
  VenueInfoModule,
  WinPredictionsModule,
  WinProbabilityModule,
} from './modules';

/**
 * Gamecast tab body (PRD "Layout").
 *
 * Mobile is one column in the order of each phase's `order` numbers below. From `lg` it is two columns, 40% / 60%,
 * with the PRD's column assignment. Every module is rendered ONCE: the two column wrappers are `display: contents`
 * on mobile (so the modules become siblings of one flex column and CSS `order` interleaves them), and real flex
 * columns from `lg` (where `order` is reset so the DOM order of each column applies).
 */

// Complete class names (Tailwind must see them); index = mobile order - 1.
const MOBILE_ORDER = [
  'order-1',
  'order-2',
  'order-3',
  'order-4',
  'order-5',
  'order-6',
  'order-7',
  'order-8',
  'order-9',
  'order-10',
] as const;

function Slot({ order, hideOnDesktop = false, children }: { order: number; hideOnDesktop?: boolean; children: ReactNode }) {
  return <div className={cn('min-w-0 lg:order-none', MOBILE_ORDER[order - 1], hideOnDesktop && 'lg:hidden')}>{children}</div>;
}

function TwoColumns({ left, right }: { left: ReactNode; right: ReactNode }) {
  const column = 'contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4';
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[2fr_3fr] lg:items-start">
      <div className={column}>{left}</div>
      <div className={column}>{right}</div>
    </div>
  );
}

export function GamecastBody({ phase }: { phase: GamePhase }) {
  switch (phase) {
    case 'pre':
      return <PregameLayout />;
    case 'live':
      return <LiveLayout />;
    case 'final':
      return <PostgameLayout />;
  }
}

/**
 * Pre. Mobile: stakes, players to watch, key stats (season), video, article(s), win predictions, injuries, standings,
 * previous results, venue. Desktop: left = players to watch, injuries, key stats; right = video, articles, win
 * predictions, standings, previous results. Game stakes (not in the PRD columns) tops the right column; the venue
 * card is mobile only because the full header already shows venue and weather before the game.
 */
function PregameLayout() {
  return (
    <TwoColumns
      left={
        <>
          <Slot order={2}><PlayersToWatchModule /></Slot>
          <Slot order={7}><InjuryReportModule /></Slot>
          <Slot order={3}><KeyTeamStatsModule source="season" /></Slot>
          <Slot order={10} hideOnDesktop><VenueInfoModule /></Slot>
        </>
      }
      right={
        <>
          <Slot order={1}><GameStakesModule /></Slot>
          <Slot order={4}><PreviewVideoModule /></Slot>
          <Slot order={5}><ArticleModule kind="preview" /></Slot>
          <Slot order={6}><WinPredictionsModule /></Slot>
          <Slot order={8}><ConferenceStandingsModule /></Slot>
          <Slot order={9}><PreviousResultsModule /></Slot>
        </>
      }
    />
  );
}

/**
 * Live. Mobile: game flow, latest plays, win probability, insights, top performers, key stats (game), win
 * predictions, injuries, venue. Desktop: left = win probability, insights, win predictions; right = top performers,
 * injuries, key stats, venue, with game flow and latest plays (not in the PRD columns) on top.
 */
function LiveLayout() {
  return (
    <TwoColumns
      left={
        <>
          <Slot order={3}><WinProbabilityModule /></Slot>
          <Slot order={4}><LiveInsightsModule /></Slot>
          <Slot order={7}><WinPredictionsModule /></Slot>
        </>
      }
      right={
        <>
          <Slot order={1}><GameFlowModule /></Slot>
          <Slot order={2}><LatestPlaysModule /></Slot>
          <Slot order={5}><TopPerformersModule /></Slot>
          <Slot order={8}><InjuryReportModule /></Slot>
          <Slot order={6}><KeyTeamStatsModule source="game" /></Slot>
          <Slot order={9}><VenueInfoModule /></Slot>
        </>
      }
    />
  );
}

/**
 * Post. Mobile: game flow, win probability, top performers, key stats, highlights (carousel + player), recap, venue.
 * Desktop: left = win probability, top performers, key stats; right = highlights, recap, venue, with game flow
 * (not in the PRD columns) on top.
 */
function PostgameLayout() {
  return (
    <TwoColumns
      left={
        <>
          <Slot order={2}><WinProbabilityModule /></Slot>
          <Slot order={3}><TopPerformersModule /></Slot>
          <Slot order={4}><KeyTeamStatsModule source="game" /></Slot>
        </>
      }
      right={
        <>
          <Slot order={1}><GameFlowModule /></Slot>
          <Slot order={5}><PostHighlightsModule /></Slot>
          <Slot order={6}><ArticleModule kind="recap" /></Slot>
          <Slot order={7}><VenueInfoModule /></Slot>
        </>
      }
    />
  );
}
