'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/lib/types';
import { AddressSearch, getDistanceKm } from './leaflet-map';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { EarthquakeDetailModal } from './earthquake-detail-modal';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  MapPin, 
  Users, 
  Clock,
  Activity,
  Sliders,
  History,
  AlertCircle,
  Home,
  Ruler,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  Filter
} from 'lucide-react';

// Convert km to miles
function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Time filter options
const TIME_FILTERS = [
  { id: '1h', label: '1 hour', ms: 60 * 60 * 1000 },
  { id: '6h', label: '6 hours', ms: 6 * 60 * 60 * 1000 },
  { id: '12h', label: '12 hours', ms: 12 * 60 * 60 * 1000 },
  { id: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { id: '48h', label: '48 hours', ms: 48 * 60 * 60 * 1000 },
  { id: '1w', label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '2w', label: '2 weeks', ms: 14 * 24 * 60 * 60 * 1000 },
  { id: '1m', label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: '3m', label: '3 months', ms: 90 * 24 * 60 * 60 * 1000 },
  { id: '6m', label: '6 months', ms: 180 * 24 * 60 * 60 * 1000 },
  { id: '1y', label: '1 year', ms: 365 * 24 * 60 * 60 * 1000 },
  { id: '2y', label: '2 years', ms: 2 * 365 * 24 * 60 * 60 * 1000 },
  { id: '5y', label: '5 years', ms: 5 * 365 * 24 * 60 * 60 * 1000 },
  { id: '10y', label: '10 years', ms: 10 * 365 * 24 * 60 * 60 * 1000 },
  { id: 'all', label: 'All time', ms: Infinity },
] as const;

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
  // Historical earthquakes - ideally 10 years of data
  historicalEarthquakes: Earthquake[];
  className?: string;
}

export function MyNeighborhood({ historicalEarthquakes, className = '' }: MyNeighborhoodProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
  } | null>(null);
  
  const [searchRadiusMiles, setSearchRadiusMiles] = useState(15); // miles
  const [showOnlyFelt, setShowOnlyFelt] = useState(true);
  const [timeFilterId, setTimeFilterId] = useState<string>('1w');
  const [showTimeFilters, setShowTimeFilters] = useState(false);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  
  // Get the current time filter
  const currentTimeFilter = TIME_FILTERS.find(f => f.id === timeFilterId) || TIME_FILTERS[5]; // default to 1 week
  
  // Filter earthquakes based on settings
  const filteredEarthquakes = useMemo(() => {
    if (!userLocation) return [];
    
    let filtered = historicalEarthquakes;
    
    // Filter by time range
    const now = Date.now();
    const cutoffTime = currentTimeFilter.ms === Infinity ? 0 : now - currentTimeFilter.ms;
    filtered = filtered.filter(eq => eq.timestamp >= cutoffTime);
    
    // Filter by distance from user location (convert miles to km for calculation)
    const searchRadiusKm = searchRadiusMiles / 0.621371;
    filtered = filtered.filter(eq => {
      const distance = getDistanceKm(
        userLocation.lat, userLocation.lon,
        eq.latitude, eq.longitude
      );
      return distance <= searchRadiusKm;
    });
    
    // Filter to only felt earthquakes if enabled
    if (showOnlyFelt) {
      filtered = filtered.filter(eq => eq.felt && eq.felt > 0);
    }
    
    // Sort by time (most recent first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [historicalEarthquakes, userLocation, searchRadiusMiles, showOnlyFelt, currentTimeFilter]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!userLocation || filteredEarthquakes.length === 0) {
      return {
        total: 0,
        feltCount: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        closestDistanceMiles: 0,
        mostRecent: null as Earthquake | null,
        largestFelt: null as Earthquake | null,
      };
    }
    
    const feltQuakes = filteredEarthquakes.filter(eq => eq.felt && eq.felt > 0);
    const magnitudes = filteredEarthquakes.map(eq => eq.magnitude);
    
    const distancesMiles = filteredEarthquakes.map(eq => 
      kmToMiles(getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude))
    );
    
    const largestFelt = feltQuakes.length > 0
      ? feltQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max)
      : null;
    
    return {
      total: filteredEarthquakes.length,
      feltCount: feltQuakes.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      closestDistanceMiles: Math.min(...distancesMiles),
      mostRecent: filteredEarthquakes[0] || null,
      largestFelt,
    };
  }, [filteredEarthquakes, userLocation]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">My Neighborhood</h2>
          <p className="text-sm text-neutral-500">Find earthquakes people felt near your address</p>
        </div>
      </div>
      
      {/* Address Search */}
      <AddressSearch
        onLocationSelect={setUserLocation}
        onClear={() => setUserLocation(null)}
        currentLocation={userLocation}
      />
      
      {/* Controls */}
      {userLocation && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Controls Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Radius Control */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Search Radius
              </label>
              <select
                value={searchRadiusMiles}
                onChange={(e) => setSearchRadiusMiles(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={15}>15 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
              </select>
            </div>
            
            {/* Time Range Button */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 flex items-center gap-1">
                <History className="w-3 h-3" /> Time Period
              </label>
              <button
                onClick={() => setShowTimeFilters(!showTimeFilters)}
                className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-sm text-left flex items-center justify-between transition-colors
                  ${showTimeFilters ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'}`}
              >
                <span>{currentTimeFilter.label}</span>
                <Filter className="w-3 h-3 text-neutral-500" />
              </button>
            </div>
            
            {/* Felt Filter */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> Show
              </label>
              <select
                value={showOnlyFelt ? 'felt' : 'all'}
                onChange={(e) => setShowOnlyFelt(e.target.value === 'felt')}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="felt">Felt earthquakes</option>
                <option value="all">All earthquakes</option>
              </select>
            </div>
          </div>
          
          {/* Time Filter Overlay */}
          {showTimeFilters && (
            <div className="p-4 bg-neutral-900/80 border border-white/10 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Show earthquakes from:</span>
                <button 
                  onClick={() => setShowTimeFilters(false)}
                  className="text-xs text-neutral-500 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setTimeFilterId(filter.id);
                      setShowTimeFilters(false);
                    }}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors
                      ${timeFilterId === filter.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <LeafletMap
          earthquakes={filteredEarthquakes}
          userLocation={userLocation}
          searchRadius={searchRadiusMiles / 0.621371}
          showOnlyFelt={showOnlyFelt}
          className="h-[400px]"
        />
        {filteredEarthquakes.length > 0 && (
          <div className="bg-neutral-900/80 px-4 py-2 text-xs text-neutral-400 flex items-center justify-between">
            <span>Showing {filteredEarthquakes.length} earthquakes from {currentTimeFilter.label}</span>
            <span>within {searchRadiusMiles} miles</span>
          </div>
        )}
      </div>
      
      {/* Results */}
      {userLocation && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity className="w-4 h-4 text-neutral-400" />}
              label="Total Found"
              value={stats.total}
              subtext={`within ${searchRadiusMiles} mi`}
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-neutral-400" />}
              label="People Felt"
              value={stats.feltCount}
              subtext="earthquakes"
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4 text-neutral-400" />}
              label="Largest"
              value={stats.maxMagnitude > 0 ? `M${stats.maxMagnitude.toFixed(1)}` : '—'}
              subtext={stats.maxMagnitude > 0 ? getMagnitudeLabel(stats.maxMagnitude) : 'No data'}
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-neutral-400" />}
              label="Closest"
              value={stats.closestDistanceMiles > 0 ? `${stats.closestDistanceMiles.toFixed(1)} mi` : '—'}
              subtext="from you"
            />
          </div>
          
          {/* Insights */}
          {stats.total > 0 && (
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
              <h4 className="font-medium text-neutral-200 mb-2">Your Neighborhood Summary</h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {generateNeighborhoodInsight(stats, searchRadiusMiles, currentTimeFilter.label, userLocation.address)}
              </p>
            </div>
          )}
          
          {/* Largest Felt Earthquake */}
          {stats.largestFelt && (
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Largest Felt Earthquake Near You
              </h4>
              <EarthquakeDetail 
                earthquake={stats.largestFelt} 
                userLocation={userLocation}
                onClick={() => setSelectedEarthquake(stats.largestFelt)}
              />
            </div>
          )}
          
            {/* Earthquake List */}
            {filteredEarthquakes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-400 flex items-center justify-between">
                  <span>Recent Earthquakes</span>
                  <span className="text-neutral-500">{filteredEarthquakes.length} found</span>
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredEarthquakes.slice(0, 50).map((eq, idx) => (
                    <EarthquakeListItem 
                      key={`${eq.id}-${idx}`} 
                      earthquake={eq}
                      userLocation={userLocation}
                      onClick={() => setSelectedEarthquake(eq)}
                    />
                  ))}
                  {filteredEarthquakes.length > 50 && (
                    <div className="text-center py-4 text-sm text-neutral-500">
                      Showing 50 of {filteredEarthquakes.length} earthquakes
                    </div>
                  )}
                </div>
              </div>
            )}
          
          {/* No Results */}
          {filteredEarthquakes.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No earthquakes found</p>
              <p className="text-sm mt-1">
                Try increasing the search radius or changing the time range
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {!userLocation && (
        <div className="text-center py-12 text-neutral-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Enter your address above</p>
          <p className="text-sm mt-1">
            See earthquakes people felt near your home over the last 10 years
          </p>
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

// Helper Components
function StatCard({ 
  icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  subtext: string;
}) {
  return (
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="flex items-center gap-2 text-neutral-500 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-light">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{subtext}</div>
    </div>
  );
}

function EarthquakeDetail({ 
  earthquake, 
  userLocation,
  onClick 
}: { 
  earthquake: Earthquake;
  userLocation: { lat: number; lon: number };
  onClick?: () => void;
}) {
  const distanceMiles = kmToMiles(getDistanceKm(
    userLocation.lat, userLocation.lon,
    earthquake.latitude, earthquake.longitude
  ));
  
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-start gap-4 text-left hover:bg-white/[0.02] p-2 -m-2 rounded-lg transition-colors group"
    >
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
        style={{ 
          backgroundColor: getMagnitudeColor(earthquake.magnitude) + '20',
          color: getMagnitudeColor(earthquake.magnitude)
        }}
      >
        {earthquake.magnitude.toFixed(1)}
      </div>
      <div className="flex-1">
        <div className="font-medium">{earthquake.place}</div>
        <div className="text-sm text-neutral-500 mt-1">
          {format(earthquake.time, 'PPP')} • {distanceMiles.toFixed(1)} mi from you
        </div>
        {earthquake.felt && earthquake.felt > 0 && (
          <div className="text-sm text-neutral-400 mt-1">
            {earthquake.felt} {earthquake.felt === 1 ? 'person' : 'people'} reported feeling this
          </div>
        )}
      </div>
      <div className="p-2 group-hover:bg-white/5 rounded-lg transition-colors">
        <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
      </div>
    </button>
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
  const distanceMiles = kmToMiles(getDistanceKm(
    userLocation.lat, userLocation.lon,
    earthquake.latitude, earthquake.longitude
  ));
  
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
          <span>{distanceMiles.toFixed(1)} mi away</span>
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

// Generate natural language insight
function generateNeighborhoodInsight(
  stats: {
    total: number;
    feltCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
    closestDistanceMiles: number;
    mostRecent: Earthquake | null;
  },
  radiusMiles: number,
  timeLabel: string,
  address: string
): string {
  const locationName = address.split(',')[0];
  
  if (stats.total === 0) {
    return `Great news! No significant earthquakes have been recorded within ${radiusMiles} miles of ${locationName} in the ${timeLabel}.`;
  }
  
  let insight = `Within ${radiusMiles} miles of ${locationName}, there have been ${stats.total} earthquakes in the ${timeLabel}`;
  
  if (stats.feltCount > 0) {
    insight += `, ${stats.feltCount} of which were felt by people`;
  }
  
  insight += `. The largest was a magnitude ${stats.maxMagnitude.toFixed(1)} earthquake`;
  
  if (stats.mostRecent) {
    const daysAgo = Math.floor((Date.now() - stats.mostRecent.timestamp) / (24 * 60 * 60 * 1000));
    if (daysAgo < 7) {
      insight += `. The most recent was just ${daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}`;
    }
  }
  
  insight += '.';
  
  return insight;
}

