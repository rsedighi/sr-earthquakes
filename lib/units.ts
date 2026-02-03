// Distance unit utilities for displaying measurements
// Default is imperial (miles) for US/Bay Area users

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
 * Format distance in miles (default for US users)
 * @param km - Distance in kilometers (from USGS data)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistance(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
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
 * Format depth in miles (default for US users)
 * @param km - Depth in kilometers
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepth(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
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
 * Shallow: < 6.2 mi (10 km), Intermediate: 6.2-18.6 mi (10-30 km), Deep: > 18.6 mi (30 km)
 */
export function getDepthDescription(depthKm: number): string {
  if (depthKm < 10) return 'Shallow';
  if (depthKm < 30) return 'Intermediate';
  return 'Deep';
}

/**
 * Format depth with "deep" suffix in miles
 * e.g., "3.1 mi deep"
 */
export function formatDepthDeep(km: number, decimals: number = 1): string {
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi deep`;
}

/**
 * Format radius/distance in miles
 * Useful for search radius, cluster radius, etc.
 */
export function formatRadius(km: number): string {
  const miles = kmToMiles(km);
  // Round to nice numbers for radius display
  const milesDisplay = miles < 1 ? miles.toFixed(1) : Math.round(miles).toString();
  return `${milesDisplay} mi`;
}

