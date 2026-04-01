import { revalidateTag } from 'next/cache';

/**
 * Bust all `use cache` entries tagged for earthquake data (history ISR, server loaders, etc.).
 * Uses profile `max` per Next.js 16 revalidateTag API.
 */
export function revalidateEarthquakeCaches(): void {
  revalidateTag('earthquakes', 'max');
}
