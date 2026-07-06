// Distance unit utilities for displaying measurements
// Default is imperial (miles) for US/Bay Area users
// Supports configurable unit system (imperial/metric)

import type { UnitSystem } from './unit-context';

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
 * Format distance based on unit system
 * @param km - Distance in kilometers (from USGS data)
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistance(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (unitSystem === 'metric') {
    return `${km.toFixed(decimals)} km`;
  }
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Format distance in compact form for tight spaces
 * @param km - Distance in kilometers
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDistanceCompact(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (unitSystem === 'metric') {
    return `${km.toFixed(decimals)} km`;
  }
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Format depth based on unit system
 * @param km - Depth in kilometers
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepth(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (unitSystem === 'metric') {
    return `${km.toFixed(decimals)} km`;
  }
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi`;
}

/**
 * Format depth in compact form for tight spaces
 * @param km - Depth in kilometers
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepthCompact(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (unitSystem === 'metric') {
    return `${km.toFixed(decimals)} km`;
  }
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
 * Get depth thresholds text based on unit system
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 */
export function getDepthThresholdsText(unitSystem: UnitSystem = 'imperial'): {
  shallow: string;
  intermediate: string;
  deep: string;
} {
  if (unitSystem === 'metric') {
    return {
      shallow: '< 10 km',
      intermediate: '10-30 km',
      deep: '> 30 km',
    };
  }
  return {
    shallow: '< 6.2 mi',
    intermediate: '6.2-18.6 mi',
    deep: '> 18.6 mi',
  };
}

/**
 * Format depth with "deep" suffix
 * e.g., "3.1 mi deep" or "5.0 km deep"
 * @param km - Depth in kilometers
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatDepthDeep(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (unitSystem === 'metric') {
    return `${km.toFixed(decimals)} km deep`;
  }
  const miles = kmToMiles(km);
  return `${miles.toFixed(decimals)} mi deep`;
}

/**
 * Format radius/distance based on unit system
 * Useful for search radius, cluster radius, etc.
 * @param km - Radius in kilometers
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 */
export function formatRadius(km: number, unitSystem: UnitSystem = 'imperial'): string {
  if (unitSystem === 'metric') {
    const kmDisplay = km < 1 ? km.toFixed(1) : Math.round(km).toString();
    return `${kmDisplay} km`;
  }
  const miles = kmToMiles(km);
  // Round to nice numbers for radius display
  const milesDisplay = miles < 1 ? miles.toFixed(1) : Math.round(miles).toString();
  return `${milesDisplay} mi`;
}

/**
 * Format distance with both units for clarity
 * e.g., "15 mi (25 km)" or "25 km (15 mi)"
 * @param km - Distance in kilometers
 * @param unitSystem - Primary unit system (shown first)
 * @param decimals - Number of decimal places (default: 0 for cleaner display)
 */
export function formatDistanceBoth(
  km: number,
  unitSystem: UnitSystem = 'imperial',
  decimals: number = 0
): string {
  const miles = kmToMiles(km);
  const milesStr = decimals === 0 ? Math.round(miles).toString() : miles.toFixed(decimals);
  const kmStr = decimals === 0 ? Math.round(km).toString() : km.toFixed(decimals);
  
  if (unitSystem === 'metric') {
    return `${kmStr} km (${milesStr} mi)`;
  }
  return `${milesStr} mi (${kmStr} km)`;
}

/**
 * Get the unit label for distance
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 * @param plural - Whether to use plural form (default: true)
 */
export function getDistanceUnit(unitSystem: UnitSystem = 'imperial', plural: boolean = true): string {
  if (unitSystem === 'metric') {
    return 'km'; // km is the same singular/plural
  }
  return plural ? 'miles' : 'mile';
}

/**
 * Get the short unit label for distance
 * @param unitSystem - 'imperial' for miles, 'metric' for km (default: imperial)
 */
export function getDistanceUnitShort(unitSystem: UnitSystem = 'imperial'): string {
  return unitSystem === 'metric' ? 'km' : 'mi';
}

/**
 * Convert a value from km to the target unit system
 * @param km - Value in kilometers
 * @param unitSystem - Target unit system
 */
export function convertFromKm(km: number, unitSystem: UnitSystem = 'imperial'): number {
  return unitSystem === 'metric' ? km : kmToMiles(km);
}

/**
 * Convert a value to km from the source unit system
 * @param value - Value in the source unit
 * @param unitSystem - Source unit system
 */
export function convertToKm(value: number, unitSystem: UnitSystem = 'imperial'): number {
  return unitSystem === 'metric' ? value : milesToKm(value);
}

/**
 * Rewrite a USGS "place" string so the embedded distance respects the user's
 * unit preference. USGS always formats places as e.g. "9 km WSW of Cotati, CA".
 * When unitSystem === 'imperial' we convert that leading number to miles.
 * Falls back to the original string if the pattern isn't matched.
 */
const PLACE_DISTANCE_RE = /^(\d+(?:\.\d+)?)\s*km\b/i;
export function formatPlaceDistance(place: string, unitSystem: UnitSystem = 'imperial'): string {
  if (unitSystem === 'metric' || !place) return place;
  const match = place.match(PLACE_DISTANCE_RE);
  if (!match) return place;
  const km = parseFloat(match[1]);
  if (!Number.isFinite(km)) return place;
  const miles = kmToMiles(km);
  // Round to whole miles when the input was a whole-km value (USGS convention),
  // otherwise keep one decimal so we don't lose precision.
  const display = Number.isInteger(km) ? Math.round(miles).toString() : miles.toFixed(1);
  return place.replace(PLACE_DISTANCE_RE, `${display} mi`);
}
