'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/lib/types';
import { AddressSearch, getDistanceKm } from './leaflet-map';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { EarthquakeDetailModal } from './earthquake-detail-modal';
import { EarthquakeExplorer } from './earthquake-explorer';
import { AffiliateRecommendations } from './affiliate-recommendations';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  MapPin, 
  Users, 
  Clock,
  Activity,
  AlertCircle,
  Home,
  ChevronRight,
  Loader2
} from 'lucide-react';

// Convert km to miles
function kmToMiles(km: number): number {
  return km * 0.621371;
}


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
  isLoadingHistorical?: boolean;
  className?: string;
}

const VISITOR_ID_KEY = 'baytremor_visitor_id';

// Generate a unique visitor ID
function generateVisitorId(): string {
  return 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get or create visitor ID
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

interface SavedAddress {
  _id: string;
  address: string;
  lat: number;
  lon: number;
  city?: string;
  lastSearchAt: string;
}

export function MyNeighborhood({ historicalEarthquakes, isLoadingHistorical = false, className = '' }: MyNeighborhoodProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
  } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);
  const [visitorId, setVisitorId] = useState<string>('');
  
  const [searchRadiusMiles, setSearchRadiusMiles] = useState(15); // miles
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  
  // Earthquake Explorer filtered results
  const [explorerFilteredEarthquakes, setExplorerFilteredEarthquakes] = useState<Earthquake[]>([]);
  
  // Initialize visitor ID and load saved addresses from MongoDB
  useEffect(() => {
    const vid = getVisitorId();
    setVisitorId(vid);
    
    if (!vid) {
      setIsLoadingFromStorage(false);
      return;
    }
    
    // Fetch saved addresses from API
    async function loadAddresses() {
      try {
        const res = await fetch(`/api/addresses?visitorId=${vid}`);
        if (res.ok) {
          const data = await res.json();
          setSavedAddresses(data.addresses || []);
          
          // Auto-select the most recent address
          if (data.addresses && data.addresses.length > 0) {
            const mostRecent = data.addresses[0];
            setUserLocation({
              lat: mostRecent.lat,
              lon: mostRecent.lon,
              address: mostRecent.address,
            });
          }
        }
      } catch (error) {
        console.error('Error loading saved addresses:', error);
      } finally {
        setIsLoadingFromStorage(false);
      }
    }
    
    loadAddresses();
  }, []);
  
  // Save location to MongoDB when user selects an address
  const handleLocationSelect = async (location: { lat: number; lon: number; address: string }) => {
    setUserLocation(location);
    
    if (!visitorId) return;
    
    // Extract city from address (usually first part before comma)
    const city = location.address.split(',')[0]?.trim();
    
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          address: location.address,
          lat: location.lat,
          lon: location.lon,
          city,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update saved addresses list
        setSavedAddresses(prev => {
          const filtered = prev.filter(a => a.address !== location.address);
          return [data.address, ...filtered].slice(0, 10);
        });
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };
  
  // Clear current location (but keep in saved list)
  const handleLocationClear = () => {
    setUserLocation(null);
  };
  
  // Select a previously saved address
  const handleSelectSavedAddress = (address: SavedAddress) => {
    setUserLocation({
      lat: address.lat,
      lon: address.lon,
      address: address.address,
    });
    // Also update in MongoDB to refresh lastSearchAt
    handleLocationSelect({
      lat: address.lat,
      lon: address.lon,
      address: address.address,
    });
  };
  
  // Filter earthquakes - use explorer results as the single source of truth
  const filteredEarthquakes = useMemo(() => {
    if (!userLocation) return [];
    
    // Use explorer filtered results if available
    if (explorerFilteredEarthquakes.length > 0) {
      return explorerFilteredEarthquakes;
    }
    
    // Fallback: basic distance filtering when explorer is initializing
    const searchRadiusKm = searchRadiusMiles / 0.621371;
    return historicalEarthquakes
      .filter(eq => {
        const distance = getDistanceKm(
          userLocation.lat, userLocation.lon,
          eq.latitude, eq.longitude
        );
        return distance <= searchRadiusKm;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [historicalEarthquakes, userLocation, searchRadiusMiles, explorerFilteredEarthquakes]);
  
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
      {/* Page Header */}
      <header className="flex items-center gap-3" role="banner" aria-label="My Neighborhood page header">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center" aria-hidden="true">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">My Neighborhood</h1>
          <p className="text-sm text-neutral-400">Find earthquakes people felt near your address</p>
        </div>
      </header>
      
      {/* Address Search */}
      <AddressSearch
        onLocationSelect={handleLocationSelect}
        onClear={handleLocationClear}
        currentLocation={userLocation}
      />
      
      {/* Previously Saved Addresses */}
      {savedAddresses.length > 0 && !userLocation && (
        <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-400">Your Saved Addresses</span>
          </div>
          <div className="divide-y divide-white/5">
            {savedAddresses.slice(0, 3).map((addr) => (
              <button
                key={addr._id}
                onClick={() => handleSelectSavedAddress(addr)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{addr.address}</div>
                  <div className="text-xs text-neutral-500">
                    Last searched {formatDistanceToNow(new Date(addr.lastSearchAt), { addSuffix: true })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Saved address indicator */}
      {userLocation && !isLoadingFromStorage && (
        <div className="flex items-center gap-2 text-xs text-green-500/80 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Your address is saved for your next visit</span>
        </div>
      )}
      
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
      
      {/* Earthquake Explorer - Unified filtering interface */}
      {userLocation && !isLoadingHistorical && (
        <div className="animate-fade-in">
          <EarthquakeExplorer
            earthquakes={historicalEarthquakes}
            userLocation={userLocation}
            onResultsChange={setExplorerFilteredEarthquakes}
            getDistance={(eq) => kmToMiles(getDistanceKm(
              userLocation.lat,
              userLocation.lon,
              eq.latitude,
              eq.longitude
            ))}
          />
        </div>
      )}
      
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <LeafletMap
          earthquakes={filteredEarthquakes}
          userLocation={userLocation}
          searchRadius={searchRadiusMiles / 0.621371}
          className="h-[400px]"
        />
        {filteredEarthquakes.length > 0 && (
          <div className="bg-neutral-900/80 px-4 py-2 text-xs text-neutral-400 flex items-center justify-between">
            <span>Showing {filteredEarthquakes.length} earthquakes</span>
            <span>within {searchRadiusMiles} miles</span>
          </div>
        )}
      </div>
      
      {/* Results */}
      {userLocation && !isLoadingHistorical && (
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
                {generateNeighborhoodInsight(stats, searchRadiusMiles, userLocation.address)}
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

          {/* Affiliate Recommendations - Protect Your Home */}
          {stats.total > 0 && (
            <AffiliateRecommendations 
              context="my-area"
              limit={6}
            />
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
      {!userLocation && !isLoadingFromStorage && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Enter your address to get started</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
            See earthquakes people have felt near your home over the last 10+ years.
            Your address is saved locally for quick access on future visits.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-500">
            <span className="px-3 py-1.5 bg-white/5 rounded-full">10+ years of data</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-full">Felt reports</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-full">Distance filtering</span>
          </div>
        </div>
      )}
      
      {/* Loading state for localStorage */}
      {isLoadingFromStorage && (
        <div className="text-center py-8 text-neutral-500">
          <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Loading saved location...</p>
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
  address: string
): string {
  const locationName = address.split(',')[0];
  
  if (stats.total === 0) {
    return `Great news! No significant earthquakes have been recorded within ${radiusMiles} miles of ${locationName} matching your filters.`;
  }
  
  let insight = `Within ${radiusMiles} miles of ${locationName}, there have been ${stats.total} earthquakes matching your filters`;
  
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

