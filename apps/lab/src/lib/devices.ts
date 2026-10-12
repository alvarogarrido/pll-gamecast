export interface Device {
  id: string;
  label: string;
  /** null = fill the available area (no scaling). */
  width: number | null;
  height: number | null;
  radius: number;
}

export const DEVICES: readonly Device[] = [
  { id: 'iphone', label: 'iPhone 15', width: 393, height: 852, radius: 38 },
  { id: 'pixel', label: 'Pixel', width: 412, height: 915, radius: 30 },
  { id: 'ipad', label: 'iPad', width: 820, height: 1180, radius: 22 },
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900, radius: 10 },
  { id: 'fit', label: 'Fit', width: null, height: null, radius: 6 },
];
