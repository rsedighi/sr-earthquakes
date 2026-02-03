'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDistanceToNow, format } from 'date-fns';
import { Search, MapPin, X, Loader2, Target, Navigation } from 'lucide-react';
import { formatDistance, formatDepth, kmToMiles } from '@/lib/units';

// Quick-zoom region presets for Bay Area
const REGION_PRESETS = [
  { id: 'all', label: 'Bay Area', center: [37.75, -122.0] as [number, number], zoom: 9 },
  { id: 'san-ramon', label: 'San Ramon', center: [37.78, -121.97] as [number, number], zoom: 11 },
  { id: 'east-bay', label: 'East Bay', center: [37.82, -122.26] as [number, number], zoom: 10 },
  { id: 'sf', label: 'SF', center: [37.77, -122.42] as [number, number], zoom: 11 },
  { id: 'south-bay', label: 'South Bay', center: [37.33, -121.89] as [number, number], zoom: 10 },
];

interface LeafletMapProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
  onSelectEarthquake?: (eq: Earthquake | null) => void;
  userLocation?: { lat: number; lon: number; address: string } | null;
  searchRadius?: number; // in km
  showOnlyFelt?: boolean;
  className?: string;
  initialRegion?: string; // Region ID to auto-center on (e.g., 'san-ramon')
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

// The actual map component - loaded only on client
function LeafletMapInner({
  earthquakes,
  selectedEarthquake,
  onSelectEarthquake,
  userLocation,
  searchRadius = 25,
  showOnlyFelt = false,
  className = '',
  initialRegion,
}: LeafletMapProps) {
  // All useState hooks at the top
  const [hoveredQuake, setHoveredQuake] = useState<Earthquake | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [leaflet, setLeaflet] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer;
    TileLayer: typeof import('react-leaflet').TileLayer;
    CircleMarker: typeof import('react-leaflet').CircleMarker;
    Circle: typeof import('react-leaflet').Circle;
    Popup: typeof import('react-leaflet').Popup;
    useMap: typeof import('react-leaflet').useMap;
    L: typeof import('leaflet');
  } | null>(null);
  const [activeRegion, setActiveRegion] = useState(() => {
    if (initialRegion && REGION_PRESETS.some(p => p.id === initialRegion)) {
      return initialRegion;
    }
    return 'all';
  });
  const [minMagnitudeFilter, setMinMagnitudeFilter] = useState<number | null>(null);

  // Dynamically import leaflet modules
  useEffect(() => {
    let mounted = true;
    
    const loadLeaflet = async () => {
      // Add Leaflet CSS via link tag
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      
      const [reactLeaflet, L] = await Promise.all([
        import('react-leaflet'),
        import('leaflet'),
      ]);

      if (mounted) {
        setLeaflet({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          CircleMarker: reactLeaflet.CircleMarker,
          Circle: reactLeaflet.Circle,
          Popup: reactLeaflet.Popup,
          useMap: reactLeaflet.useMap,
          L: L.default,
        });
        setMapReady(true);
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter earthquakes based on settings
  const displayedQuakes = useMemo(() => {
    let filtered = earthquakes;
    
    if (showOnlyFelt) {
      filtered = filtered.filter(eq => eq.felt && eq.felt > 0);
    }
    
    if (userLocation && searchRadius) {
      filtered = filtered.filter(eq => {
        const distance = getDistanceKm(
          userLocation.lat, userLocation.lon,
          eq.latitude, eq.longitude
        );
        return distance <= searchRadius;
      });
    }
    
    // Apply magnitude filter from legend
    if (minMagnitudeFilter !== null) {
      filtered = filtered.filter(eq => eq.magnitude >= minMagnitudeFilter);
    }
    
    return filtered;
  }, [earthquakes, showOnlyFelt, userLocation, searchRadius, minMagnitudeFilter]);

  // Get size based on magnitude - exponential scaling for better visual distinction
  const getMagnitudeSize = (magnitude: number): number => {
    // More aggressive scaling: M5+ are much larger than M1-2
    if (magnitude >= 5) return 30;
    if (magnitude >= 4) return 22;
    if (magnitude >= 3) return 16;
    if (magnitude >= 2) return 11;
    if (magnitude >= 1) return 7;
    return 5;
  };

  const mapRef = useRef<L.Map | null>(null);
  
  // Map controller component to access the map instance
  const MapController = useMemo(() => {
    if (!leaflet) return () => null;
    const { useMap } = leaflet;
    
    return function MapControllerInner({ region }: { region: string }) {
      const map = useMap();
      
      useEffect(() => {
        mapRef.current = map;
      }, [map]);
      
      useEffect(() => {
        const preset = REGION_PRESETS.find(p => p.id === region);
        if (preset && map) {
          map.flyTo(preset.center, preset.zoom, { duration: 0.8 });
        }
      }, [region, map]);
      
      return null;
    };
  }, [leaflet]);
  
  // Handler for user location button
  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lon], 12, { duration: 0.8 });
      setActiveRegion(''); // Deselect preset buttons
    }
  }, [userLocation]);

  if (!mapReady || !leaflet) {
    return (
      <div className={`w-full min-h-[400px] bg-neutral-900/50 rounded-xl flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Circle, Popup } = leaflet;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[37.75, -122.0]}
        zoom={9}
        className="w-full h-full min-h-[400px] rounded-xl z-0"
        style={{ background: '#1a1a1a' }}
      >
        {/* Map controller for programmatic navigation */}
        <MapController region={activeRegion} />
        
        {/* Dark mode tile layer - CartoDB Dark Matter (free, no key needed) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* User location circle radius */}
        {userLocation && searchRadius && (
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={searchRadius * 1000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}
        
        {/* User location marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={10}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">Your Location</div>
                <div className="text-gray-600">{userLocation.address}</div>
              </div>
            </Popup>
          </CircleMarker>
        )}
        
        {/* Earthquake markers */}
        {displayedQuakes.map((eq, idx) => {
          const isSelected = selectedEarthquake?.id === eq.id;
          const isHovered = hoveredQuake?.id === eq.id;
          const size = getMagnitudeSize(eq.magnitude);
          
          return (
            <CircleMarker
              key={`${eq.id}-${idx}`}
              center={[eq.latitude, eq.longitude]}
              radius={isSelected || isHovered ? size * 1.3 : size}
              pathOptions={{
                color: isSelected ? '#ffffff' : getMagnitudeColor(eq.magnitude),
                fillColor: getMagnitudeColor(eq.magnitude),
                fillOpacity: isSelected || isHovered ? 0.9 : 0.6,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{
                click: () => onSelectEarthquake?.(isSelected ? null : eq),
                mouseover: () => setHoveredQuake(eq),
                mouseout: () => setHoveredQuake(null),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getMagnitudeColor(eq.magnitude) }}
                    >
                      {eq.magnitude.toFixed(1)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{getMagnitudeLabel(eq.magnitude)}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(eq.time, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">{eq.place}</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Depth: {formatDepth(eq.depth)}</div>
                    <div>Time: {format(eq.time, 'PPpp')}</div>
                    {eq.felt && eq.felt > 0 && (
                      <div className="text-amber-600 font-medium">
                        👋 {eq.felt} {eq.felt === 1 ? 'person' : 'people'} felt this
                      </div>
                    )}
                    {userLocation && (
                      <div className="text-blue-600">
                        📍 {formatDistance(getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude))} from you
                      </div>
                    )}
                  </div>
                  <a 
                    href={eq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-xs text-blue-500 hover:text-blue-700"
                  >
                    View on USGS →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Quick-zoom region presets */}
      <div className="absolute top-3 left-3 right-14 flex items-center gap-1.5 z-[1000] overflow-x-auto scrollbar-none">
        {REGION_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => setActiveRegion(preset.id)}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap transition-all flex-shrink-0 ${
              activeRegion === preset.id
                ? 'bg-white text-black shadow-lg'
                : 'bg-black/70 text-white/80 hover:bg-black/90 hover:text-white backdrop-blur-sm'
            }`}
          >
            {preset.label}
          </button>
        ))}
        {userLocation && (
          <button
            onClick={handleCenterOnUser}
            className={`p-1.5 rounded-md transition-all flex-shrink-0 ${
              activeRegion === ''
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-black/70 text-blue-400 hover:bg-black/90 backdrop-blur-sm'
            }`}
            title="Center on my location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {/* Stats overlay - only show when user has selected a location */}
      {userLocation && (
        <div className="absolute top-12 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
          <div className="text-xs text-neutral-400">
            <span className="text-white font-medium">{displayedQuakes.length}</span> earthquakes
            {showOnlyFelt && <span className="text-amber-400 ml-1">felt</span>}
            <span className="text-blue-400 ml-1">within {Math.round(kmToMiles(searchRadius))} mi ({searchRadius} km)</span>
          </div>
        </div>
      )}

      {/* Interactive Magnitude Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-[1000]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400 font-medium">Magnitude</span>
          {minMagnitudeFilter !== null && (
            <button
              onClick={() => setMinMagnitudeFilter(null)}
              className="text-[10px] text-blue-400 hover:text-blue-300"
            >
              Show all
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {[
            { mag: 2, label: '2+' },
            { mag: 3, label: '3+' },
            { mag: 4, label: '4+' },
            { mag: 5, label: '5+' },
          ].map(({ mag, label }) => {
            const isActive = minMagnitudeFilter === mag;
            const count = earthquakes.filter(eq => eq.magnitude >= mag).length;
            return (
              <button
                key={mag}
                onClick={() => setMinMagnitudeFilter(isActive ? null : mag)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-md transition-all ${
                  isActive 
                    ? 'bg-white/20 ring-1 ring-white/40' 
                    : 'hover:bg-white/10'
                }`}
                title={`${count} earthquakes M${mag}+`}
              >
                <div 
                  className={`rounded-full transition-transform ${isActive ? 'scale-125' : ''}`}
                  style={{
                    width: getMagnitudeSize(mag) * 0.7,
                    height: getMagnitudeSize(mag) * 0.7,
                    backgroundColor: getMagnitudeColor(mag),
                    opacity: isActive || minMagnitudeFilter === null ? 1 : 0.4,
                  }}
                />
                <span className={`text-[10px] ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {minMagnitudeFilter !== null && (
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-neutral-400">
            Showing {displayedQuakes.length} quakes M{minMagnitudeFilter}+
          </div>
        )}
      </div>
    </div>
  );
}

// Export wrapper component
export function LeafletMap(props: LeafletMapProps) {
  return <LeafletMapInner {...props} />;
}

// Address Search Component (uses free Nominatim API)
interface AddressSearchProps {
  onLocationSelect: (location: { lat: number; lon: number; address: string }) => void;
  onClear: () => void;
  currentLocation: { lat: number; lon: number; address: string } | null;
}

// Bay Area bounding box coordinates
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -123.0,
  maxLon: -121.0,
};

export function AddressSearch({ onLocationSelect, onClear, currentLocation }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Geocode using free Nominatim API (OpenStreetMap) - restricted to Bay Area
  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Use viewbox to restrict results to Bay Area and bounded=1 to strictly enforce it
      const viewbox = `${BAY_AREA_BOUNDS.minLon},${BAY_AREA_BOUNDS.maxLat},${BAY_AREA_BOUNDS.maxLon},${BAY_AREA_BOUNDS.minLat}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', California')}&viewbox=${viewbox}&bounded=1&limit=8`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      
      // Filter results to ensure they're within Bay Area bounds
      const filteredResults = data.filter((result: { lat: string; lon: string }) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        return (
          lat >= BAY_AREA_BOUNDS.minLat &&
          lat <= BAY_AREA_BOUNDS.maxLat &&
          lon >= BAY_AREA_BOUNDS.minLon &&
          lon <= BAY_AREA_BOUNDS.maxLon
        );
      });
      
      setResults(filteredResults);
      setShowResults(true);
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) searchAddress(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: { display_name: string; lat: string; lon: string }) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      address: result.display_name,
    });
    setQuery('');
    setShowResults(false);
  };

  if (currentLocation) {
    return (
      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
        <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-blue-100 truncate">
            {currentLocation.address.split(',')[0]}
          </div>
          <div className="text-xs text-blue-400/70 truncate">
            {currentLocation.address.split(',').slice(1, 3).join(',')}
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors"
          aria-label="Clear location"
        >
          <X className="w-4 h-4 text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Enter your Bay Area address..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {query.length > 0 && query.length < 3 && (
        <div className="mt-2 text-xs text-neutral-500">
          Type at least 3 characters to search...
        </div>
      )}
      
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-[300px] overflow-y-auto">
          <div className="px-3 py-2 text-xs text-neutral-500 bg-white/5 border-b border-white/10">
            Bay Area Results
          </div>
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-neutral-300 line-clamp-2">
                  {result.display_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showResults && results.length === 0 && query.length >= 3 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
          <div className="px-4 py-6 text-center text-neutral-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Bay Area addresses found</p>
            <p className="text-xs mt-1">Try a street name or city in the SF Bay Area</p>
          </div>
        </div>
      )}
    </div>
  );
}

export { getDistanceKm };
