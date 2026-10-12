import { useId } from 'react';
import { Icon } from '@pll/icons';
import { Card } from '../../atoms/Card';
import { Chip } from '../../atoms/Chip';
import { Skeleton } from '../../atoms/Skeleton';
import { SectionHeader } from '../../molecules/SectionHeader';
import { cn } from '../../lib/cn';
import {
  attendanceLabel,
  isIndoor,
  locationLabel,
  precipitationLabel,
  temperatureLabel,
  weatherLabel,
  type VenueGame,
  type WeatherCondition,
} from './venue.logic';

export interface VenueInfoProps {
  /** Only `venue`, `weather`, `neutralSite` and `attendance` are read. */
  game: VenueGame;
  /**
   * `card` (default): a module card with its own header, for the Live/Post columns.
   * `inline`: two compact lines without chrome, for the pregame header bar.
   */
  variant?: 'card' | 'inline';
  loading?: boolean;
  className?: string;
}

/** PRIVATE weather glyphs (the icon set has none). Decorative: the condition is always written next to it. */
function WeatherGlyph({ condition, className }: { condition: WeatherCondition; className?: string }) {
  const common = {
    'aria-hidden': true as const,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('size-6 shrink-0', className),
  };
  const cloud = 'M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z';
  switch (condition) {
    case 'clear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    case 'partly_cloudy':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 2.5v1M2.5 8h1M4.1 4.1l.7.7M11.9 4.1l-.7.7" />
          <path d="M9 20h8a3.5 3.5 0 0 0 .4-6.98A4.75 4.75 0 0 0 9 12.5 3.75 3.75 0 0 0 9 20z" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg {...common}>
          <path d={cloud} />
        </svg>
      );
    case 'rain':
      return (
        <svg {...common}>
          <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15z" />
          <path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" />
        </svg>
      );
    case 'snow':
      return (
        <svg {...common}>
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
        </svg>
      );
    case 'wind':
      return (
        <svg {...common}>
          <path d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 14h14a2.5 2.5 0 1 1-2.5 2.5M3 19h6" />
        </svg>
      );
    case 'indoor':
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6" />
        </svg>
      );
  }
}

/**
 * Venue information [Live/Post, and inside the pregame header]: stadium name, city and state, a neutral-site note, the
 * weather (temperature in °F, condition, precipitation chance) and the attendance once it is known. A missing forecast
 * (`weather: null`) or an `indoor` condition reads "Indoor venue" instead of numbers.
 */
export function VenueInfo({ game, variant = 'card', loading = false, className }: VenueInfoProps) {
  const titleId = useId();
  const { venue, weather, neutralSite, attendance } = game;
  const indoor = isIndoor(weather);
  const crowd = attendanceLabel(attendance);
  const precipitation = weather && !indoor ? precipitationLabel(weather) : null;
  const location = locationLabel(venue);

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col gap-1 text-footnote text-text-secondary', className)}>
        <p className="flex items-center gap-1">
          <Icon name="location" size={16} className="shrink-0" />
          <span className="min-w-0">
            <span className="font-semibold text-text-primary">{venue.name}</span>
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            {location}
            {neutralSite && ' · Neutral site'}
          </span>
        </p>
        <p className="flex items-center gap-1">
          {weather && !indoor ? (
            <>
              <WeatherGlyph condition={weather.condition} className="size-4" />
              <span>
                {temperatureLabel(weather)} · {weatherLabel(weather.condition)}
                {precipitation && ` · ${precipitation}`}
              </span>
            </>
          ) : (
            <>
              <WeatherGlyph condition="indoor" className="size-4" />
              <span>Indoor venue</span>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <Card as="section" aria-labelledby={titleId} aria-busy={loading || undefined} className={cn('flex flex-col gap-3', className)}>
      <SectionHeader title={<span id={titleId}>Venue</span>} />
      {loading ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading venue</span>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton variant="rect" className="h-16 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-headline font-semibold text-text-primary">{venue.name}</h3>
              {neutralSite && <Chip size="sm">Neutral site</Chip>}
            </div>
            <p className="flex items-center gap-1 text-footnote text-text-secondary">
              <Icon name="location" size={16} className="shrink-0" />
              {location}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-sm bg-surface-track p-3">
            {weather && !indoor ? (
              <>
                <WeatherGlyph condition={weather.condition} className="size-8 text-accent-gold" />
                <p className="font-display text-score tabular-nums text-text-primary">
                  <span className="sr-only">Temperature </span>
                  {temperatureLabel(weather)}
                </p>
                <div className="flex min-w-0 flex-col text-footnote">
                  <span className="font-semibold text-text-primary">{weatherLabel(weather.condition)}</span>
                  {precipitation && <span className="text-text-secondary">{precipitation}</span>}
                </div>
              </>
            ) : (
              <>
                <WeatherGlyph condition="indoor" className="size-8 text-text-secondary" />
                <div className="flex flex-col text-footnote">
                  <span className="font-semibold text-text-primary">Indoor venue</span>
                  <span className="text-text-secondary">Weather does not affect play.</span>
                </div>
              </>
            )}
          </div>

          {crowd && (
            <p className="flex items-center justify-between gap-2 border-t border-border-hairline pt-3 text-footnote">
              <span className="text-text-secondary">Attendance</span>
              <span className="font-semibold tabular-nums text-text-primary">{crowd}</span>
            </p>
          )}
        </>
      )}
    </Card>
  );
}
