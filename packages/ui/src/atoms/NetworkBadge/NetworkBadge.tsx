import { NetworkLogo, type NetworkId, type NetworkVariant } from '@pll/icons';
import { Chip, type ChipSize } from '../Chip/Chip';

export interface NetworkBadgeProps {
  /** Broadcast network name as the API sends it: "ESPN2", "ESPN+", "ACC Network", "Big Ten Network", "B1G+". */
  network: string;
  /** Logo colors: `white` (default, for the dark UI) or `color`. Text chips ignore it. */
  variant?: NetworkVariant;
  /** Logo height in px. Default 16. */
  height?: number;
  /** Chip size for networks without a logo. */
  chipSize?: ChipSize;
  className?: string;
}

const logoByName: Record<string, NetworkId> = {
  abc: 'abc',
  espn: 'espn',
  'espn+': 'espn-plus',
  'espn plus': 'espn-plus',
  espn2: 'espn2',
  'espn 2': 'espn2',
  'espn app': 'espn-app',
  'espn-app': 'espn-app',
};

const abbreviations: Record<string, string> = {
  'acc network': 'ACCN',
  'accn': 'ACCN',
  'big ten network': 'BTN',
  'sec network': 'SECN',
  'cbs sports network': 'CBSSN',
  'b1g+': 'B1G+',
};

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

/** The logo id for a network name, or `null` when we have no artwork. */
export function networkLogoId(network: string): NetworkId | null {
  return logoByName[normalize(network)] ?? null;
}

/** Short text for networks without a logo: a known abbreviation, the name when short, otherwise its initials. */
export function networkAbbreviation(network: string): string {
  const key = normalize(network);
  const known = abbreviations[key];
  if (known) return known;
  const name = network.trim();
  if (name.length <= 6) return name;
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Broadcast network: the real logo for ESPN, ESPN+, ESPN2, ABC and ESPN App, otherwise a compact text chip
 * ("ACCN", "BTN", "FS1"). The full name is the accessible name in both cases.
 */
export function NetworkBadge({ network, variant = 'white', height = 16, chipSize = 'sm', className }: NetworkBadgeProps) {
  const id = networkLogoId(network);
  if (id) {
    return (
      <span className={className} data-network={id}>
        <NetworkLogo network={id} variant={variant} height={height} title={network} />
      </span>
    );
  }
  return (
    <Chip tone="outline" size={chipSize} className={className} role="img" aria-label={network} data-network="text">
      <span aria-hidden="true">{networkAbbreviation(network)}</span>
    </Chip>
  );
}
