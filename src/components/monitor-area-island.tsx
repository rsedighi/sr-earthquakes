'use client';

import { useMyCity } from '@/hooks/use-my-city';
import { MonitorAreaCard } from '@/components/monitor-area';

interface MonitorAreaIslandProps {
  /** City known from the page URL; takes precedence over the visitor's saved city. */
  city?: string | null;
  source: string;
  headline?: string;
}

// Standalone "Monitor my area" card for server-rendered Astro pages.
export function MonitorAreaIsland({ city, source, headline }: MonitorAreaIslandProps) {
  const { myCity, setCityByName, availableCities } = useMyCity([]);
  return (
    <MonitorAreaCard
      cities={availableCities}
      currentCity={city ?? myCity?.cityName ?? null}
      onCityChange={setCityByName}
      source={source}
      headline={headline}
    />
  );
}
