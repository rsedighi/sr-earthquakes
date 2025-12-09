'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/lib/types';
import { AddressSearch, getDistanceKm } from './leaflet-map';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
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
  Loader2
} from 'lucide-react';

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
  
  const [searchRadius, setSearchRadius] = useState(25); // km
  const [showOnlyFelt, setShowOnlyFelt] = useState(true);
  const [timeRange, setTimeRange] = useState<'1y' | '5y' | '10y' | 'all'>('10y');
  
  // Filter earthquakes based on settings
  const filteredEarthquakes = useMemo(() => {
    if (!userLocation) return [];
    
    let filtered = historicalEarthquakes;
    
    // Filter by time range
    const now = Date.now();
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    const cutoffs: Record<string, number> = {
      '1y': now - yearMs,
      '5y': now - 5 * yearMs,
      '10y': now - 10 * yearMs,
      'all': 0,
    };
    filtered = filtered.filter(eq => eq.timestamp >= cutoffs[timeRange]);
    
    // Filter by distance from user location
    filtered = filtered.filter(eq => {
      const distance = getDistanceKm(
        userLocation.lat, userLocation.lon,
        eq.latitude, eq.longitude
      );
      return distance <= searchRadius;
    });
    
    // Filter to only felt earthquakes if enabled
    if (showOnlyFelt) {
      filtered = filtered.filter(eq => eq.felt && eq.felt > 0);
    }
    
    // Sort by time (most recent first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [historicalEarthquakes, userLocation, searchRadius, showOnlyFelt, timeRange]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!userLocation || filteredEarthquakes.length === 0) {
      return {
        total: 0,
        feltCount: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        closestDistance: 0,
        mostRecent: null as Earthquake | null,
        largestFelt: null as Earthquake | null,
      };
    }
    
    const feltQuakes = filteredEarthquakes.filter(eq => eq.felt && eq.felt > 0);
    const magnitudes = filteredEarthquakes.map(eq => eq.magnitude);
    
    const distances = filteredEarthquakes.map(eq => 
      getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude)
    );
    
    const largestFelt = feltQuakes.length > 0
      ? feltQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max)
      : null;
    
    return {
      total: filteredEarthquakes.length,
      feltCount: feltQuakes.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      closestDistance: Math.min(...distances),
      mostRecent: filteredEarthquakes[0] || null,
      largestFelt,
    };
  }, [filteredEarthquakes, userLocation]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
        <div className="grid grid-cols-3 gap-4 animate-fade-in">
          {/* Radius Control */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-500 flex items-center gap-1">
              <Ruler className="w-3 h-3" /> Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value={10}>10 km (6 mi)</option>
              <option value={25}>25 km (15 mi)</option>
              <option value={50}>50 km (31 mi)</option>
              <option value={100}>100 km (62 mi)</option>
            </select>
          </div>
          
          {/* Time Range */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-500 flex items-center gap-1">
              <History className="w-3 h-3" /> Time Period
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="1y">Last year</option>
              <option value="5y">Last 5 years</option>
              <option value="10y">Last 10 years</option>
              <option value="all">All time</option>
            </select>
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
      )}
      
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <LeafletMap
          earthquakes={historicalEarthquakes}
          userLocation={userLocation}
          searchRadius={searchRadius}
          showOnlyFelt={showOnlyFelt}
          className="h-[400px]"
        />
      </div>
      
      {/* Results */}
      {userLocation && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity className="w-4 h-4 text-purple-400" />}
              label="Total Found"
              value={stats.total}
              subtext={`within ${searchRadius}km`}
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-amber-400" />}
              label="People Felt"
              value={stats.feltCount}
              subtext="earthquakes"
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4 text-red-400" />}
              label="Largest"
              value={stats.maxMagnitude > 0 ? `M${stats.maxMagnitude.toFixed(1)}` : '—'}
              subtext={stats.maxMagnitude > 0 ? getMagnitudeLabel(stats.maxMagnitude) : 'No data'}
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-blue-400" />}
              label="Closest"
              value={stats.closestDistance > 0 ? `${stats.closestDistance.toFixed(1)}km` : '—'}
              subtext="from you"
            />
          </div>
          
          {/* Insights */}
          {stats.total > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <h4 className="font-medium text-blue-100 mb-2">📊 Your Neighborhood Summary</h4>
              <p className="text-sm text-blue-200/80 leading-relaxed">
                {generateNeighborhoodInsight(stats, searchRadius, timeRange, userLocation.address)}
              </p>
            </div>
          )}
          
          {/* Largest Felt Earthquake */}
          {stats.largestFelt && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <h4 className="text-sm font-medium text-amber-200 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Largest Felt Earthquake Near You
              </h4>
              <EarthquakeDetail 
                earthquake={stats.largestFelt} 
                userLocation={userLocation}
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
  userLocation 
}: { 
  earthquake: Earthquake;
  userLocation: { lat: number; lon: number };
}) {
  const distance = getDistanceKm(
    userLocation.lat, userLocation.lon,
    earthquake.latitude, earthquake.longitude
  );
  
  return (
    <div className="flex items-start gap-4">
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white"
        style={{ backgroundColor: getMagnitudeColor(earthquake.magnitude) }}
      >
        {earthquake.magnitude.toFixed(1)}
      </div>
      <div className="flex-1">
        <div className="font-medium">{earthquake.place}</div>
        <div className="text-sm text-neutral-500 mt-1">
          {format(earthquake.time, 'PPP')} • {distance.toFixed(1)} km from you
        </div>
        {earthquake.felt && earthquake.felt > 0 && (
          <div className="text-sm text-amber-400 mt-1">
            {earthquake.felt} {earthquake.felt === 1 ? 'person' : 'people'} reported feeling this
          </div>
        )}
      </div>
      <a
        href={earthquake.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        <ArrowUpRight className="w-4 h-4 text-neutral-500" />
      </a>
    </div>
  );
}

function EarthquakeListItem({ 
  earthquake, 
  userLocation 
}: { 
  earthquake: Earthquake;
  userLocation: { lat: number; lon: number };
}) {
  const distance = getDistanceKm(
    userLocation.lat, userLocation.lon,
    earthquake.latitude, earthquake.longitude
  );
  
  return (
    <a
      href={earthquake.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ backgroundColor: getMagnitudeColor(earthquake.magnitude) }}
      >
        {earthquake.magnitude.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{earthquake.place}</div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
          <span>{format(earthquake.time, 'MMM d, yyyy')}</span>
          <span>•</span>
          <span>{distance.toFixed(1)} km away</span>
          {earthquake.felt && earthquake.felt > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-400">{earthquake.felt} felt</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
    </a>
  );
}

// Generate natural language insight
function generateNeighborhoodInsight(
  stats: {
    total: number;
    feltCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
    closestDistance: number;
    mostRecent: Earthquake | null;
  },
  radius: number,
  timeRange: string,
  address: string
): string {
  const locationName = address.split(',')[0];
  const timeLabel = timeRange === '1y' ? 'year' : timeRange === '5y' ? '5 years' : timeRange === '10y' ? '10 years' : 'recorded history';
  
  if (stats.total === 0) {
    return `Great news! No significant earthquakes have been recorded within ${radius}km of ${locationName} in the last ${timeLabel}.`;
  }
  
  let insight = `Within ${radius}km of ${locationName}, there have been ${stats.total} earthquakes in the last ${timeLabel}`;
  
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
  
  // Add context based on activity level
  const yearlyRate = stats.total / (timeRange === '1y' ? 1 : timeRange === '5y' ? 5 : 10);
  if (yearlyRate < 5) {
    insight += ' This is considered relatively low seismic activity.';
  } else if (yearlyRate > 20) {
    insight += ' This area experiences frequent minor seismic activity.';
  }
  
  return insight;
}

