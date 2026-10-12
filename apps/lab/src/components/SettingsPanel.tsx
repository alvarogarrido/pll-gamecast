import { useId } from 'react';
import { DATA_FLAG_KEYS, NETWORK_MODES, presets, type DataFlagKey, type NetworkMode } from '@pll/scenarios';
import type { Lab } from '../useLab';
import { gameSrc } from '../useLab';
import { GamePicker } from './GamePicker';
import { Timeline } from './Timeline';
import { Button, Section, Toggle } from './ui';

const NETWORK_LABEL: Record<NetworkMode, { label: string; hint: string }> = {
  online: { label: 'Online', hint: 'Normal responses' },
  slow: { label: 'Slow', hint: 'Delayed by the latency below' },
  flaky: { label: 'Flaky', hint: '30% of calls answer 503' },
  server_error: { label: 'API errors', hint: 'Every call answers 500' },
  offline: { label: 'Offline', hint: 'Calls and cross-origin images fail, navigator.onLine = false' },
};

const FLAG_LABEL: Record<DataFlagKey, { label: string; hint: string }> = {
  hideWeather: { label: 'No weather', hint: 'weather: null' },
  hideRanks: { label: 'No ranks / RPI', hint: 'unranked teams' },
  hidePhotos: { label: 'No photos', hint: 'players, staff, articles' },
  noPlays: { label: 'No plays', hint: 'empty play log, empty box score' },
  noMedia: { label: 'No media', hint: 'no videos or articles' },
  longNames: { label: 'Very long names', hint: 'schools, mascots, players, staff' },
};

export function SettingsPanel({ lab }: { lab: Lab }) {
  const { db, state, info } = lab;
  const netName = useId();
  if (!db || !state || !info) return <p className="p-4 text-dim">Starting…</p>;

  const activePreset = presets.find((p) => p.id === state.presetId);
  const availability = Object.fromEntries(presets.map((p) => [p.id, p.availability?.(db, state.gameId) ?? { enabled: true }]));
  const activeNote = availability[state.presetId]?.note;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Game">
        <GamePicker db={db} gameId={state.gameId} onSelect={lab.selectGame} />
      </Section>

      <Section title="Scenario">
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => {
            const a = availability[p.id] ?? { enabled: true };
            const active = p.id === state.presetId;
            return (
              <button
                key={p.id}
                type="button"
                disabled={!a.enabled}
                aria-pressed={active}
                title={a.note ?? p.description}
                onClick={() => lab.selectPreset(p.id)}
                className={`rounded-md border px-2.5 py-1.5 text-left text-[12px] leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                  active
                    ? 'border-accent bg-accent/10 text-fg'
                    : 'border-line bg-raised text-dim enabled:hover:border-line-strong enabled:hover:text-fg'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {activePreset ? (
          <p className="mt-2.5 text-[11.5px] text-dim">
            {activePreset.description}
            {activeNote ? <span className="mt-1 block text-warn">{activeNote}</span> : null}
          </p>
        ) : null}
      </Section>

      <Section title="Time">
        <Timeline
          db={db}
          state={state}
          status={info.focus.status}
          elapsed={info.focus.elapsed}
          onSeek={lab.seek}
          onPlaying={lab.setPlaying}
          onSpeed={lab.setSpeed}
        />
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px]">
          <dt className="text-faint">serverTime</dt>
          <dd className="text-dim tabular-nums">{info.nowIso.replace('T', ' ').replace(/\.\d+Z$/, 'Z')}</dd>
        </dl>
      </Section>

      <Section title="Network">
        <div role="radiogroup" aria-label="Network" className="space-y-0.5">
          {NETWORK_MODES.map((mode) => (
            <label
              key={mode}
              className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover ${state.network === mode ? 'bg-raised' : ''}`}
            >
              <input
                type="radio"
                name={netName}
                checked={state.network === mode}
                onChange={() => lab.setNetwork(mode)}
                className="mt-[3px] accent-[var(--color-accent)]"
              />
              <span>
                <span className="block text-[13px]">{NETWORK_LABEL[mode].label}</span>
                <span className="block text-[11px] text-faint">{NETWORK_LABEL[mode].hint}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 flex justify-between font-mono text-[11px] text-dim">
            <span>Latency</span>
            <span className="tabular-nums">{(state.latencyMs / 1000).toFixed(1)} s</span>
          </span>
          <input
            type="range"
            className="lab-range"
            min={0}
            max={8000}
            step={100}
            value={state.latencyMs}
            onChange={(e) => lab.setLatency(Number(e.target.value))}
            aria-label="API latency in milliseconds"
          />
        </label>
      </Section>

      <Section title="Data">
        <div className="-mx-2">
          {DATA_FLAG_KEYS.map((key) => (
            <Toggle
              key={key}
              checked={state.dataFlags[key]}
              onChange={() => lab.toggleFlag(key)}
              label={FLAG_LABEL[key].label}
              hint={FLAG_LABEL[key].hint}
            />
          ))}
        </div>
      </Section>

      <Section title="App">
        <div className="flex flex-wrap gap-2">
          <Button onClick={lab.reload}>↻ Reload app</Button>
          <a
            href={gameSrc(state.gameId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line-strong bg-raised px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-hover"
          >
            Open prototype in new tab ↗
          </a>
        </div>
        <p className="mt-2.5 text-[11.5px] text-faint">
          The new tab is the plain prototype: scenarios only apply inside the frame, so it always shows the shipped data.
        </p>
      </Section>
    </div>
  );
}
