import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeDb } from '../scripts/generate';
import { generateDb } from '../scripts/gen';
import { DEFAULT_DB_DIR, loadDbFromDisk } from '../scripts/load-db';
import { buildApi } from '../src/build-api';
import { db } from './helpers';

describe('determinism', () => {
  it('generating twice with the same seed gives identical output', () => {
    const a = JSON.stringify(generateDb());
    const b = JSON.stringify(generateDb());
    expect(a).toBe(b);
  });

  it('a different seed gives a different (but valid) season', () => {
    expect(JSON.stringify(generateDb('another-seed'))).not.toBe(JSON.stringify(generateDb()));
  });

  it('the committed db/ folder is exactly what the generator produces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pll-db-'));
    try {
      writeDb(generateDb(), dir);
      const files = readdirSync(dir, { recursive: true }).map(String).sort();
      expect(files).toEqual(readdirSync(DEFAULT_DB_DIR, { recursive: true }).map(String).sort());
      for (const file of files.filter((f) => f.endsWith('.json'))) {
        expect(readFileSync(join(dir, file), 'utf8')).toBe(readFileSync(join(DEFAULT_DB_DIR, file), 'utf8'));
      }
      expect(loadDbFromDisk(dir).games).toHaveLength(db.games.length);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('buildApi is deterministic', () => {
    const once = JSON.stringify([...buildApi(db)]);
    expect(JSON.stringify([...buildApi(db)])).toBe(once);
  });
});
