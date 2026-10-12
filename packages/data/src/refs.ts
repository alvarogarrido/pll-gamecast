/** Denormalized reference objects used across API responses. */
import type { PlayerRef, TeamRef } from './api';
import type { Player, Team } from './schema';

export function toTeamRef(team: Team): TeamRef {
  const { id, slug, school, mascot, abbreviation, colors, logoUrl } = team;
  return { id, slug, school, mascot, abbreviation, colors: { ...colors }, logoUrl };
}

export function toPlayerRef(player: Player): PlayerRef {
  const { id, teamId, firstName, lastName, jerseyNumber, position, classYear, photoUrl } = player;
  return { id, teamId, firstName, lastName, jerseyNumber, position, classYear, photoUrl };
}
