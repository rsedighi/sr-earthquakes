import type { Earthquake } from '@/lib/types';

export function deduplicateEarthquakes(earthquakes: Earthquake[]): Earthquake[] {
  const seen = new Set<string>();
  const result: Earthquake[] = [];
  for (const eq of earthquakes) {
    if (!seen.has(eq.id)) {
      seen.add(eq.id);
      result.push(eq);
    }
  }
  return result;
}

export function parseAiSummary(summary: string): { headline: string; details: string; context: string } | null {
  if (!summary) return null;
  
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  
  if (sentences.length === 0) return null;
  
  const headline = sentences[0] || '';
  const details = sentences.slice(1, -1).join(' ');
  const context = sentences.length > 1 ? sentences[sentences.length - 1] : '';
  
  return { headline, details, context };
}

export function getDistanceKmLocal(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
