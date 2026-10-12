import { useEffect, useRef, useState } from 'react';
import type { Device } from '../lib/devices';
import { applyOnline, patchEarly } from '../lib/offline-patch';

interface Props {
  device: Device;
  src: string;
  token: number;
  offline: boolean;
}

/** The framed prototype, scaled down to fit the available area. */
export function DeviceFrame({ device, src, token, offline }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const offlineRef = useRef(offline);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Network switched while the app is running: flip navigator.onLine + fire the event, no reload.
  useEffect(() => {
    offlineRef.current = offline;
    if (frame.current) applyOnline(frame.current, offline);
  }, [offline]);

  // Every new document needs the override again; do it before the app's first request when possible.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    return patchEarly(el, () => offlineRef.current);
  }, [token, src]);

  const pad = 24;
  const availW = Math.max(120, size.w - pad * 2);
  const availH = Math.max(120, size.h - pad * 2 - 22);
  const fill = device.width === null || device.height === null;
  const width = fill ? availW : (device.width as number);
  const height = fill ? availH : (device.height as number);
  const scale = fill ? 1 : Math.min(1, availW / width, availH / height);

  return (
    <div ref={area} className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden">
      <div
        className="shrink-0 overflow-hidden border border-line-strong bg-black shadow-[0_24px_64px_-24px_rgb(0_0_0/0.8)]"
        style={{ width: width * scale, height: height * scale, borderRadius: Math.max(4, device.radius * scale) }}
      >
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <iframe
            key={token}
            ref={frame}
            src={src}
            title="Prototype"
            onLoad={() => frame.current && applyOnline(frame.current, offlineRef.current)}
            className="block h-full w-full border-0 bg-white"
          />
        </div>
      </div>
      <p className="mt-2 h-4 font-mono text-[11px] text-faint">
        {device.label}
        {fill ? ` · ${Math.round(width)}×${Math.round(height)}` : ` · ${width}×${height}`}
        {scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}
      </p>
    </div>
  );
}
