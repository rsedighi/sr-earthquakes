import type { UnitSystem } from '@/lib/unit-context';
import { formatPlaceDistance } from '@/lib/units';

interface ShareableQuake {
  magnitude: number | null | undefined;
  place: string | null | undefined;
  timestamp: number;
}

/**
 * Title/text used when sharing an earthquake. Uses an absolute Pacific time
 * (relative "6 hours ago" goes stale once posted) and the user's distance unit.
 */
export function earthquakeShareCopy(quake: ShareableQuake, unitSystem: UnitSystem = 'imperial') {
  const mag = typeof quake.magnitude === 'number' && !isNaN(quake.magnitude) ? `M${quake.magnitude.toFixed(1)} earthquake` : 'Earthquake';
  const place = quake.place ? formatPlaceDistance(quake.place, unitSystem) : '';
  // USGS places look like "12 km SE of Livermore, CA", "Livermore, CA", or "Northern California".
  const where = !place ? 'in the Bay Area' : /^\d/.test(place) ? place : place.includes(',') ? `near ${place}` : `in ${place}`;
  const title = `${mag} ${where}`;
  const when = new Date(quake.timestamp).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return { title, text: `${title} (${when}). Did you feel it?` };
}

export function shareCardUrl(id: string, opts: { square?: boolean; unitSystem?: UnitSystem } = {}) {
  const params = new URLSearchParams();
  if (opts.square) params.set('size', 'square');
  if (opts.unitSystem === 'metric') params.set('units', 'metric');
  const qs = params.toString();
  return `/earthquake/${encodeURIComponent(id)}/opengraph-image${qs ? `?${qs}` : ''}`;
}
