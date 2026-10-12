import { useEffect, useRef, useState } from 'react';
import type { Db } from '@pll/data/db';
import { matchup, shortDate } from '../lib/format';
import { StatusChip } from './ui';

export function GamePicker({ db, gameId, onSelect }: { db: Db; gameId: string; onSelect(id: string): void }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const current = db.games.find((g) => g.id === gameId);
  const sorted = [...db.games].sort((a, b) => b.startTime.localeCompare(a.startTime));

  useEffect(() => {
    if (open) listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  return (
    <div>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-raised px-3 py-2 text-left hover:bg-hover"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{current ? matchup(db, current) : 'Pick a game'}</span>
          <span className="block font-mono text-[11px] text-dim">{current ? `${shortDate(current.startTime)} · week ${current.week}` : ''}</span>
        </span>
        <span className="flex items-center gap-2">
          {current ? <StatusChip status={current.status} /> : null}
          <span aria-hidden className={`text-dim transition-transform ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </span>
      </button>
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Games"
          className="mt-1.5 max-h-72 overflow-y-auto rounded-md border border-line-strong bg-bg py-1"
        >
          {sorted.map((g) => {
            const selected = g.id === gameId;
            return (
              <li key={g.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(g.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-hover ${selected ? 'bg-raised' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px]">{matchup(db, g)}</span>
                    <span className="block font-mono text-[10.5px] text-faint">
                      {shortDate(g.startTime)} · wk {g.week}
                      {g.gameType !== 'regular' ? ' · NCAA' : ''}
                    </span>
                  </span>
                  <StatusChip status={g.status} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
