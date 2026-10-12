import { describe, expect, it } from 'vitest';
import type { PlayerRef, TeamRef } from '@pll/data/api';
import { groupInjuries, hasInjuries, injuryTone, type InjuryEntry, type InjuryGame } from './injury.logic';

const team = (id: string) => ({ id, school: id, mascot: '', abbreviation: id, colors: { primary: '#000', secondary: '#fff' } }) as unknown as TeamRef;
const game = { away: { team: team('duke') }, home: { team: team('nd') } } as unknown as InjuryGame;
const injury = (teamId: string, lastName: string, status: InjuryEntry['status']): InjuryEntry =>
  ({
    playerId: `${teamId}-${lastName}`,
    status,
    description: 'Ankle',
    updatedAt: '2027-03-01T00:00:00Z',
    player: { id: `${teamId}-${lastName}`, teamId, firstName: 'A', lastName } as PlayerRef,
  }) as InjuryEntry;

describe('groupInjuries', () => {
  it('groups away first then home, sorted by severity then name', () => {
    const groups = groupInjuries(
      [injury('nd', 'Zed', 'out'), injury('duke', 'Beta', 'day_to_day'), injury('duke', 'Alpha', 'out'), injury('duke', 'Aaa', 'questionable')],
      game,
    );
    expect(groups.map((g) => g.side)).toEqual(['away', 'home']);
    expect(groups[0]!.injuries.map((i) => i.player.lastName)).toEqual(['Alpha', 'Aaa', 'Beta']);
    expect(groups[1]!.injuries).toHaveLength(1);
  });
  it('drops players from other teams and reports emptiness', () => {
    const groups = groupInjuries([injury('yale', 'X', 'out')], game);
    expect(hasInjuries(groups)).toBe(false);
    expect(groups.every((g) => g.injuries.length === 0)).toBe(true);
  });
});

describe('injuryTone', () => {
  it('maps statuses to tones', () => {
    expect(injuryTone('out')).toBe('negative');
    expect(injuryTone('doubtful')).toBe('gold');
    expect(injuryTone('questionable')).toBe('gold');
    expect(injuryTone('day_to_day')).toBe('neutral');
  });
});
