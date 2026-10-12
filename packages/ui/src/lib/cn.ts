import { clsx, type ClassValue } from 'clsx';

/** Class-name joiner. Components pass complete, static Tailwind class strings (so the scanner sees them). */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
