'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Earthquake } from '@/lib/types';
import { BAY_AREA_LANDMARKS, getRegionForCoordinates, getRegionById } from '@/lib/regions';

const STORAGE_KEY = 'earthquake-tracker-my-city';

// Cities available for selection
export const SELECTABLE_CITIES = BAY_AREA_LANDMARKS
  .filter(l => l.type === 'city')
  .sort((a, b) => a.name.localeCompare(b.name));

interface MyCityData {
  cityName: string;
  lat: number;
  lon: number;
  county: string;
}

interface MyCityStats {
  nearbyCount: number;
  nearbyThisWeek: number;
  nearestEarthquake: Earthquake | null;
  distanceToNearest: number;
  isElevated: boolean;
  regionId: string | null;
  regionName: string | null;
}

// Haversine distance calculation
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function useMyCity(earthquakes: Earthquake[]) {
  const [myCity, setMyCityState] = useState<MyCityData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMyCityState(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
    setIsLoaded(true);
  }, []);
  
  // Save to localStorage
  const setMyCity = useCallback((city: MyCityData | null) => {
    setMyCityState(city);
    try {
      if (city) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore errors
    }
  }, []);
  
  // Set city by name (convenience function)
  const setCityByName = useCallback((cityName: string) => {
    const city = SELECTABLE_CITIES.find(c => c.name === cityName);
    if (city) {
      setMyCity({
        cityName: city.name,
        lat: city.lat,
        lon: city.lon,
        county: city.county,
      });
    }
  }, [setMyCity]);
  
  // Calculate stats for the selected city
  const stats = useMemo((): MyCityStats | null => {
    if (!myCity || earthquakes.length === 0) return null;
    
    const radiusMiles = 10; // 10 mile radius - reasonable for Bay Area cities
    const radiusKm = radiusMiles / 0.621371; // Convert to km for calculation
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Find earthquakes near the city
    const nearbyQuakes = earthquakes
      .map(eq => ({
        ...eq,
        distanceKm: getDistanceKm(myCity.lat, myCity.lon, eq.latitude, eq.longitude),
        distanceMiles: kmToMiles(getDistanceKm(myCity.lat, myCity.lon, eq.latitude, eq.longitude)),
      }))
      .filter(eq => eq.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    
    const nearbyThisWeek = nearbyQuakes.filter(eq => now - eq.timestamp < oneWeekMs);
    
    const regionId = getRegionForCoordinates(myCity.lat, myCity.lon);
    const region = regionId !== 'unknown' ? getRegionById(regionId) : null;
    
    // Determine if elevated (more than 5 quakes in a week within 10mi is elevated for Bay Area)
    const isElevated = nearbyThisWeek.length > 5;
    
    return {
      nearbyCount: nearbyQuakes.length,
      nearbyThisWeek: nearbyThisWeek.length,
      nearestEarthquake: nearbyQuakes[0] || null,
      distanceToNearest: nearbyQuakes[0] ? nearbyQuakes[0].distanceMiles : 0,
      isElevated,
      regionId: regionId !== 'unknown' ? regionId : null,
      regionName: region?.name || null,
    };
  }, [myCity, earthquakes]);
  
  return {
    myCity,
    setMyCity,
    setCityByName,
    stats,
    isLoaded,
    availableCities: SELECTABLE_CITIES,
  };
}

