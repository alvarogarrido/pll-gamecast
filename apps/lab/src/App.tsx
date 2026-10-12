import { useEffect, useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { SettingsPanel } from './components/SettingsPanel';
import { Segmented } from './components/ui';
import { DEVICES } from './lib/devices';
import { matchup } from './lib/format';
import { readStored, writeStored } from './lib/storage';
import { presets } from '@pll/scenarios';
import { useLab } from './useLab';

const PANEL_KEY = 'pll-lab:panel-open';
const DEVICE_KEY = 'pll-lab:device';
const PANEL_WIDTH = 372;

export function App() {
  const lab = useLab();
  const [panelOpen, setPanelOpen] = useState(() => readStored(PANEL_KEY) !== '0');
  const [deviceId, setDeviceId] = useState(() => {
    const stored = readStored(DEVICE_KEY);
    return DEVICES.some((d) => d.id === stored) ? (stored as string) : 'iphone';
  });
  const [copied, setCopied] = useState(false);
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0]!;

  useEffect(() => writeStored(PANEL_KEY, panelOpen ? '1' : '0'), [panelOpen]);
  useEffect(() => writeStored(DEVICE_KEY, deviceId), [deviceId]);

  const game = lab.db?.games.find((g) => g.id === lab.state?.gameId);
  const preset = presets.find((p) => p.id === lab.state?.presetId);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the URL bar already holds the link */
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-panel px-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="grid h-5 w-5 place-items-center rounded-sm bg-accent font-mono text-[11px] font-bold text-accent-ink">
            L
          </span>
          <span className="font-mono text-[12px] font-medium tracking-wide">scenario-lab</span>
        </div>
        <Segmented<string>
          label="Device"
          value={deviceId}
          options={DEVICES.map((d) => ({ value: d.id, label: d.label }))}
          onChange={setDeviceId}
          className="max-w-full overflow-x-auto"
        />
        <div className="ml-auto hidden min-w-0 items-center gap-3 md:flex">
          {game && lab.db ? (
            <span className="truncate font-mono text-[11.5px] text-dim">
              {matchup(lab.db, game)} <span className="text-faint">/</span> <span className="text-fg">{preset?.label}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-line-strong bg-raised px-2.5 py-1 font-mono text-[11px] hover:bg-hover"
          >
            {copied ? 'Copied' : 'Copy scenario link'}
          </button>
          <span
            className="flex items-center gap-1.5 font-mono text-[11px] text-dim"
            title={lab.status === 'ready' ? 'The service worker controls this page and fakes /api/v1 for the frame.' : (lab.error ?? 'Starting')}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${lab.status === 'ready' ? 'bg-accent' : lab.status === 'error' ? 'bg-danger' : 'bg-warn'}`} />
            {lab.status === 'ready' ? 'SW active' : lab.status === 'error' ? 'SW error' : 'starting'}
          </span>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <main className="lab-main h-full transition-[padding] duration-200" data-panel={panelOpen ? 'open' : 'closed'}>
          <div className="h-full">
            {lab.status === 'error' ? (
              <div className="mx-auto mt-24 max-w-md rounded-lg border border-danger/40 bg-danger/10 p-5">
                <h1 className="mb-1 text-[14px] font-medium text-danger">The Lab could not start</h1>
                <p className="text-[12.5px] text-dim">{lab.error}</p>
              </div>
            ) : lab.frame ? (
              <DeviceFrame device={device} src={lab.frame.src} token={lab.frame.token} offline={lab.state?.network === 'offline'} />
            ) : (
              <p className="grid h-full place-items-center font-mono text-[12px] text-faint">Starting the service worker…</p>
            )}
          </div>
        </main>

        <button
          type="button"
          aria-expanded={panelOpen}
          aria-controls="lab-settings"
          onClick={() => setPanelOpen((o) => !o)}
          className="absolute top-24 z-20 flex flex-col items-center gap-2 rounded-l-lg border border-r-0 border-line-strong bg-panel px-1.5 py-3 font-mono text-[11px] tracking-[0.12em] text-dim uppercase transition-[right,color] duration-200 hover:text-fg"
          style={{ right: panelOpen ? PANEL_WIDTH : 0, writingMode: 'vertical-rl' }}
        >
          <span aria-hidden style={{ writingMode: 'horizontal-tb' }}>{panelOpen ? '›' : '‹'}</span>
          Settings
        </button>

        <aside
          id="lab-settings"
          aria-label="Scenario settings"
          aria-hidden={!panelOpen}
          inert={!panelOpen}
          className="absolute inset-y-0 right-0 z-10 border-l border-line-strong bg-panel transition-transform duration-200"
          style={{ width: PANEL_WIDTH, maxWidth: '100%', transform: panelOpen ? 'none' : 'translateX(100%)' }}
        >
          <SettingsPanel lab={lab} />
        </aside>
      </div>
    </div>
  );
}
