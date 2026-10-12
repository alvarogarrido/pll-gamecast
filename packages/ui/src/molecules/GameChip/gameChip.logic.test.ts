import { describe, expect, it } from 'vitest';
import { gameBucket } from './gameChip.logic';

describe('gameBucket', () => {
  it('maps statuses to buckets', () => {
    expect(gameBucket({ status: 'live' })).toBe('live');
    expect(gameBucket({ status: 'final' })).toBe('completed');
    for (const s of ['scheduled', 'delayed', 'postponed', 'canceled'] as const) expect(gameBucket({ status: s })).toBe('upcoming');
  });
});
