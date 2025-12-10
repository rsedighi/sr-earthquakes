// Distance unit utilities for displaying measurements
// Shows both miles and kilometers (miles first for US/Bay Area users)

// Conversion constants
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

/**
 * Format distance showing both miles and km
 * @param km - Distance in kilometers (from USGS data)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistance(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi (${km.toFixed(decimals)} km)`;
}

/**
 * Format distance in compact form for tight spaces
 * @param km - Distance in kilometers
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistanceCompact(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Format depth showing both miles and km
 * @param km - Depth in kilometers
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepth(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi (${km.toFixed(decimals)} km)`;
}

/**
 * Format depth in compact form for tight spaces
 * @param km - Depth in kilometers
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepthCompact(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Get depth description based on value
 * Shallow: < 10km (6.2 mi), Intermediate: 10-30km (6.2-18.6 mi), Deep: > 30km (18.6 mi)
 */
export function getDepthDescription(depthKm: number): string {
  if (depthKm < 10) return 'Shallow';
  if (depthKm < 30) return 'Intermediate';
  return 'Deep';
}

/**
 * Format depth with "deep" suffix showing both units
 * e.g., "3.1 mi (5.0 km) deep"
 */
export function formatDepthDeep(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi (${km.toFixed(decimals)} km) deep`;
}

/**
 * Format radius/distance showing both units
 * Useful for search radius, cluster radius, etc.
 */
export function formatRadius(km: number): string {
  const miles = kmToMiles(km);
  // Round to nice numbers for radius display
  const milesDisplay = miles < 1 ? miles.toFixed(1) : Math.round(miles).toString();
  const kmDisplay = km < 1 ? km.toFixed(1) : Math.round(km).toString();
  return `${milesDisplay} mi (${kmDisplay} km)`;
}

