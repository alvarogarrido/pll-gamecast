import { useEffect, useMemo, useRef, useState } from 'react';
import type { Db } from '@pll/data/db';
import { SPEEDS, buildTimeline, scoreAt, type ScenarioState } from '@pll/scenarios';
import { clockLabel, teamName } from '../lib/format';
import { Button, Segmented, StatusChip } from './ui';

interface Props {
  db: Db;
  state: ScenarioState;
  status: string;
  /** Resolved focus elapsed (moves while the clock plays). */
  elapsed: number | null;
  onSeek(elapsed: number): void;
  onPlaying(playing: boolean): void;
  onSpeed(speed: number): void;
}

export function Timeline({ db, state, status, elapsed, onSeek, onPlaying, onSpeed }: Props) {
  const game = db.games.find((g) => g.id === state.gameId);
  const timeline = useMemo(() => buildTimeline(db, state.gameId), [db, state.gameId]);
  const [drag, setDrag] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setDrag(null), [state.gameId]);

  const shown = drag ?? elapsed ?? 0;
  const score = scoreAt(timeline, shown);
  const away = game ? teamName(db, game.away.teamId) : 'Away';
  const home = game ? teamName(db, game.home.teamId) : 'Home';

  const commit = (value: number) => {
    clearTimeout(timer.current);
    setDrag(null);
    onSeek(value);
  };

  if (timeline.end === 0) return <p className="text-[12px] text-faint">This game has no play log, so there is no timeline.</p>;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[13px] tabular-nums">
            <span className="text-dim">{away.slice(0, 12)}</span> <span className="text-fg">{score.away}</span>
            <span className="text-faint"> – </span>
            <span className="text-fg">{score.home}</span> <span className="text-dim">{home.slice(0, 12)}</span>
          </div>
          <div className="font-mono text-[11px] text-dim tabular-nums">
            {clockLabel(shown, timeline.end)} · {Math.floor(shown)}s / {timeline.end}s
          </div>
        </div>
        <StatusChip status={status} />
      </div>

      <div className="relative pb-5">
        <input
          type="range"
          className="lab-range"
          aria-label="Game timeline"
          aria-valuetext={clockLabel(shown, timeline.end)}
          min={0}
          max={timeline.end}
          step={1}
          value={Math.min(shown, timeline.end)}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDrag(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => commit(v), 350);
          }}
          onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-[7px] top-[14px] h-4">
          {timeline.ticks.map((t) => (
            <span
              key={t.elapsed}
              className="absolute top-0 -translate-x-1/2 font-mono text-[9.5px] text-faint"
              style={{ left: `${(t.elapsed / timeline.end) * 100}%` }}
            >
              <span className="mx-auto mb-px block h-1.5 w-px bg-line-strong" />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button variant={state.clock.playing ? 'default' : 'primary'} onClick={() => onPlaying(!state.clock.playing)} className="min-w-[84px]">
          {state.clock.playing ? '❚❚ Pause' : '▶ Play'}
        </Button>
        <Segmented
          label="Playback speed"
          value={state.clock.speed}
          options={SPEEDS.map((s) => ({ value: s as number, label: `${s}×` }))}
          onChange={onSpeed}
        />
      </div>
      <p className="mt-2 text-[11px] text-faint">
        Drag to jump (the app reloads). While playing, the app’s own 15 s polling picks up new plays.
      </p>
    </div>
  );
}
