'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, Target } from 'lucide-react';

// Haversine distance calculation
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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


// Address Search Component - Fast autocomplete with multiple provider fallback
interface AddressSearchProps {
  onLocationSelect: (location: { lat: number; lon: number; address: string }) => void;
  onClear: () => void;
  currentLocation: { lat: number; lon: number; address: string } | null;
}

interface GeocodingResult {
  display_name: string;
  short_name: string;
  lat: number;
  lon: number;
  type: string;
}

// Bay Area bounding box for geolocation validation
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -123.0,
  maxLon: -121.0,
};

export function AddressSearch({ onLocationSelect, onClear, currentLocation }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fast geocoding using our API route
  const searchAddress = useCallback(async (searchQuery: string) => {
    // Require 3+ chars: fewer wasted upstream calls and protects rate limits
    // while still surfacing partial street addresses early.
    if (searchQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(searchQuery)}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json() as { results?: GeocodingResult[] };
      setResults(data.results || []);
      setShowResults(true);
      setHighlightedIndex(-1);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Geocoding error:', error);
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search - 250ms balances responsiveness with fewer requests
  // per keystroke (important for staying inside geocoder free tiers).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchAddress(query.trim());
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, searchAddress]);

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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: GeocodingResult) => {
    onLocationSelect({
      lat: result.lat,
      lon: result.lon,
      address: result.display_name,
    });
    setQuery('');
    setResults([]);
    setShowResults(false);
    setHighlightedIndex(-1);
  };

  // Use device geolocation
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    
    setIsGeolocating(true);
    setGeoError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate within Bay Area
        if (
          latitude < BAY_AREA_BOUNDS.minLat ||
          latitude > BAY_AREA_BOUNDS.maxLat ||
          longitude < BAY_AREA_BOUNDS.minLon ||
          longitude > BAY_AREA_BOUNDS.maxLon
        ) {
          setGeoError('Location outside Bay Area');
          setIsGeolocating(false);
          return;
        }
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=en`
          );
          const data = await response.json() as {
            features?: { properties: { housenumber?: string; street?: string; name?: string; city?: string; state?: string } }[];
          };
          
          let address = 'Your current location';
          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const parts = [];
            if (props.housenumber && props.street) {
              parts.push(`${props.housenumber} ${props.street}`);
            } else if (props.street) {
              parts.push(props.street);
            } else if (props.name) {
              parts.push(props.name);
            }
            if (props.city) parts.push(props.city);
            if (props.state) parts.push(props.state);
            address = parts.join(', ') || address;
          }
          
          onLocationSelect({ lat: latitude, lon: longitude, address });
        } catch {
          // If reverse geocode fails, still use the location
          onLocationSelect({
            lat: latitude,
            lon: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        }
        setIsGeolocating(false);
      },
      (error) => {
        let errorMsg = 'Unable to get location';
        if (error.code === 1) errorMsg = 'Location access denied';
        if (error.code === 2) errorMsg = 'Location unavailable';
        if (error.code === 3) errorMsg = 'Location request timed out';
        setGeoError(errorMsg);
        setIsGeolocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 60000 
      }
    );
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address, city, or neighborhood..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          enterKeyHint="search"
          className="w-full pl-10 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!isSearching && !query && (
            <button
              onClick={handleUseMyLocation}
              disabled={isGeolocating}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white disabled:opacity-50"
              title="Use my location"
            >
              {isGeolocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Geolocation error */}
      {geoError && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span>
          <span>{geoError}</span>
        </div>
      )}
      
      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[2000] max-h-[320px] overflow-y-auto overscroll-contain">
          <div className="px-3 py-2 text-xs text-neutral-500 bg-white/5 border-b border-white/10 sticky top-0">
            Bay Area Results
          </div>
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lon}-${i}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`w-full px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${
                highlightedIndex === i 
                  ? 'bg-blue-500/20' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  highlightedIndex === i ? 'text-blue-400' : 'text-neutral-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${
                    highlightedIndex === i ? 'text-white' : 'text-neutral-300'
                  }`}>
                    {result.short_name || result.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-neutral-500 truncate mt-0.5">
                    {result.display_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* No results state */}
      {showResults && results.length === 0 && query.length >= 2 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[2000]">
          <div className="px-4 py-6 text-center text-neutral-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No addresses found</p>
            <p className="text-xs mt-1">Try a different search term</p>
            <button
              onClick={handleUseMyLocation}
              disabled={isGeolocating}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 mx-auto"
            >
              <Target className="w-3 h-3" />
              <span>Use my current location instead</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

