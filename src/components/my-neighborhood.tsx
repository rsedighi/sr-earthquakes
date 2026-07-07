'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Earthquake } from '@/lib/types';
import { AddressSearch, getDistanceKm } from './leaflet-map';
import { getMagnitudeColor } from '@/lib/analysis';
import { EarthquakeDetailModal } from './earthquake-detail-modal';
import { HomeRiskReport } from './home-risk-report';
import { format } from 'date-fns';
import { useUnits } from '@/lib/unit-context';
import { formatDistance } from '@/lib/units';
import { MapPin, ChevronRight, Loader2 } from 'lucide-react';

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(
  () => import('./leaflet-map').then(mod => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-neutral-900/50 rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }
);

interface MyNeighborhoodProps {
  historicalEarthquakes: Earthquake[];
  isLoadingHistorical?: boolean;
  onRequestHistoricalData?: () => void;
  className?: string;
}

const VISITOR_ID_KEY = 'baytremor_visitor_id';
const LAST_ADDRESS_KEY = 'baytremor_last_address';

// Radius used to define "near you" (~15 miles).
const NEARBY_RADIUS_KM = 25;
// Cap the number of markers handed to Leaflet — dense urban areas can match
// thousands of micro-quakes and one SVG circle each locks up the page.
const MAX_MAP_MARKERS = 300;

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

interface UserLocation {
  lat: number;
  lon: number;
  address: string;
}

function loadLastAddress(): UserLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_ADDRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number' || !parsed.address) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function MyNeighborhood({ historicalEarthquakes, isLoadingHistorical = false, onRequestHistoricalData, className = '' }: MyNeighborhoodProps) {
  const { unitSystem } = useUnits();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);

  // Restore last address + visitor id from localStorage.
  useEffect(() => {
    setVisitorId(getVisitorId());
    setUserLocation(loadLastAddress());
    setHydrated(true);
  }, []);

  // Request historical data once we have a user location
  useEffect(() => {
    if (userLocation && !isLoadingHistorical && historicalEarthquakes.length === 0 && onRequestHistoricalData) {
      onRequestHistoricalData();
    }
  }, [userLocation, isLoadingHistorical, historicalEarthquakes.length, onRequestHistoricalData]);

  const handleLocationSelect = (location: UserLocation) => {
    setUserLocation(location);
    try {
      localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(location));
    } catch {
      // Storage full/blocked — the page still works for this visit.
    }
  };

  const handleLocationClear = () => {
    setUserLocation(null);
    try {
      localStorage.removeItem(LAST_ADDRESS_KEY);
    } catch {
      // ignore
    }
  };

  // Quakes within the nearby radius, newest first.
  const nearbyEarthquakes = useMemo(() => {
    if (!userLocation) return [];
    return historicalEarthquakes
      .filter(eq => getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude) <= NEARBY_RADIUS_KM)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [historicalEarthquakes, userLocation]);

  const mapEarthquakes = useMemo(
    () => nearbyEarthquakes.slice(0, MAX_MAP_MARKERS),
    [nearbyEarthquakes]
  );

  // Three headline facts + the short felt list.
  const facts = useMemo(() => {
    if (nearbyEarthquakes.length === 0) return null;
    const felt = nearbyEarthquakes.filter(eq => eq.felt && eq.felt > 0);
    const largest = nearbyEarthquakes.reduce((max, eq) => (eq.magnitude > max.magnitude ? eq : max));
    return {
      total: nearbyEarthquakes.length,
      feltCount: felt.length,
      largest,
      recentFelt: felt.slice(0, 5),
    };
  }, [nearbyEarthquakes]);

  return (
    <div className={`space-y-6 ${className}`}>
      <AddressSearch
        onLocationSelect={handleLocationSelect}
        onClear={handleLocationClear}
        currentLocation={userLocation}
      />

      {/* Historical Data Loading Indicator */}
      {userLocation && isLoadingHistorical && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-100">Loading historical earthquake data...</p>
            <p className="text-xs text-blue-400/70">This may take a moment for 10+ years of data</p>
          </div>
        </div>
      )}

      {/* Home Seismic Risk Report + lead capture — server-computed, so it
          renders as soon as an address is chosen, before the big dataset loads */}
      {userLocation && (
        <div className="animate-fade-in">
          <HomeRiskReport userLocation={userLocation} visitorId={visitorId} />
        </div>
      )}

      {/* Map */}
      {userLocation && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <LeafletMap
            earthquakes={mapEarthquakes}
            userLocation={userLocation}
            searchRadius={NEARBY_RADIUS_KM}
            className="h-[400px]"
          />
          {nearbyEarthquakes.length > 0 && (
            <div className="bg-neutral-900/80 px-4 py-2 text-xs text-neutral-400 flex items-center justify-between">
              <span>
                {nearbyEarthquakes.length > MAX_MAP_MARKERS
                  ? `Showing the ${MAX_MAP_MARKERS} most recent of ${nearbyEarthquakes.length} earthquakes`
                  : `Showing ${nearbyEarthquakes.length} earthquakes`}
              </span>
              <span>within {formatDistance(NEARBY_RADIUS_KM, unitSystem, 0)}</span>
            </div>
          )}
        </div>
      )}

      {/* Headline facts */}
      {userLocation && !isLoadingHistorical && facts && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <FactCard
              value={facts.total.toLocaleString()}
              label="earthquakes near you"
              sub="since 2000"
            />
            <FactCard
              value={facts.feltCount.toLocaleString()}
              label="felt by people"
              sub="reported to USGS"
            />
            <FactCard
              value={`M${facts.largest.magnitude.toFixed(1)}`}
              label="largest nearby"
              sub={format(facts.largest.time, 'yyyy')}
            />
          </div>

          {/* Most recent felt quakes — short, clickable */}
          {facts.recentFelt.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-400">Recently felt near you</h4>
              <div className="space-y-2">
                {facts.recentFelt.map(eq => (
                  <EarthquakeListItem
                    key={eq.id}
                    earthquake={eq}
                    userLocation={userLocation}
                    onClick={() => setSelectedEarthquake(eq)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No nearby quakes */}
      {userLocation && !isLoadingHistorical && historicalEarthquakes.length > 0 && !facts && (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No earthquakes on record within {formatDistance(NEARBY_RADIUS_KM, unitSystem, 0)} of this address.
        </div>
      )}

      {/* Empty State */}
      {!userLocation && hydrated && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Enter your address to get started</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
            Get your home&apos;s seismic risk profile and see earthquakes people have felt
            near you over the last 10+ years. Your address stays on this device.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-500">
            <span className="px-3 py-1.5 bg-white/5 rounded-full">10+ years of data</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-full">Felt reports</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-full">Free risk report</span>
          </div>
        </div>
      )}

      {/* Earthquake Detail Modal */}
      {selectedEarthquake && (
        <EarthquakeDetailModal
          earthquake={selectedEarthquake}
          onClose={() => setSelectedEarthquake(null)}
          breadcrumb="My Neighborhood"
          allEarthquakes={historicalEarthquakes}
        />
      )}
    </div>
  );
}

function FactCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-center">
      <div className="text-2xl font-light">{value}</div>
      <div className="text-xs text-neutral-300 mt-1">{label}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

function EarthquakeListItem({
  earthquake,
  userLocation,
  onClick
}: {
  earthquake: Earthquake;
  userLocation: { lat: number; lon: number };
  onClick?: () => void;
}) {
  const { unitSystem } = useUnits();
  const distanceKm = getDistanceKm(
    userLocation.lat, userLocation.lon,
    earthquake.latitude, earthquake.longitude
  );

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group text-left"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          backgroundColor: getMagnitudeColor(earthquake.magnitude) + '20',
          color: getMagnitudeColor(earthquake.magnitude)
        }}
      >
        {earthquake.magnitude.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{earthquake.place}</div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
          <span>{format(earthquake.time, 'MMM d, yyyy')}</span>
          <span>•</span>
          <span>{formatDistance(distanceKm, unitSystem, 1)} away</span>
          {earthquake.felt && earthquake.felt > 0 && (
            <>
              <span>•</span>
              <span className="text-neutral-300">{earthquake.felt} felt</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
    </button>
  );
}
