'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDistanceToNow, format } from 'date-fns';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface LeafletMapProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
  onSelectEarthquake?: (eq: Earthquake | null) => void;
  userLocation?: { lat: number; lon: number; address: string } | null;
  searchRadius?: number; // in km
  showOnlyFelt?: boolean;
  className?: string;
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
}: LeafletMapProps) {
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
    
    return filtered;
  }, [earthquakes, showOnlyFelt, userLocation, searchRadius]);

  // Get size based on magnitude
  const getMagnitudeSize = (magnitude: number): number => {
    return Math.max(5, Math.min(25, Math.pow(2, magnitude) * 1.2));
  };

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
        {displayedQuakes.map(eq => {
          const isSelected = selectedEarthquake?.id === eq.id;
          const isHovered = hoveredQuake?.id === eq.id;
          const size = getMagnitudeSize(eq.magnitude);
          
          return (
            <CircleMarker
              key={eq.id}
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
                    <div>Depth: {eq.depth.toFixed(1)} km</div>
                    <div>Time: {format(eq.time, 'PPpp')}</div>
                    {eq.felt && eq.felt > 0 && (
                      <div className="text-amber-600 font-medium">
                        👋 {eq.felt} {eq.felt === 1 ? 'person' : 'people'} felt this
                      </div>
                    )}
                    {userLocation && (
                      <div className="text-blue-600">
                        📍 {getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude).toFixed(1)} km from you
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
      
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
        <div className="text-xs text-neutral-400">
          <span className="text-white font-medium">{displayedQuakes.length}</span> earthquakes
          {showOnlyFelt && <span className="text-amber-400 ml-1">felt</span>}
          {userLocation && <span className="text-blue-400 ml-1">within {searchRadius}km</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-[1000]">
        <div className="text-neutral-400 mb-2 font-medium">Magnitude</div>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map(mag => (
            <div key={mag} className="flex items-center gap-1">
              <div 
                className="rounded-full"
                style={{
                  width: getMagnitudeSize(mag) / 2,
                  height: getMagnitudeSize(mag) / 2,
                  backgroundColor: getMagnitudeColor(mag),
                }}
              />
              <span className="text-neutral-500">{mag}</span>
            </div>
          ))}
        </div>
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

export function AddressSearch({ onLocationSelect, onClear, currentLocation }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Geocode using free Nominatim API (OpenStreetMap)
  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=us&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      setResults(data);
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
          placeholder="Enter your address..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-neutral-300 line-clamp-2">
                  {result.display_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { getDistanceKm };
