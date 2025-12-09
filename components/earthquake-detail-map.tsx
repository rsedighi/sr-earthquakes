'use client';

import { useEffect, useState, useMemo } from 'react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor } from '@/lib/analysis';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface EarthquakeDetailMapProps {
  earthquake: Earthquake;
  nearbyEarthquakes?: Earthquake[];
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

export function EarthquakeDetailMap({
  earthquake,
  nearbyEarthquakes = [],
  className = '',
}: EarthquakeDetailMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [leaflet, setLeaflet] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer;
    TileLayer: typeof import('react-leaflet').TileLayer;
    CircleMarker: typeof import('react-leaflet').CircleMarker;
    Circle: typeof import('react-leaflet').Circle;
    Popup: typeof import('react-leaflet').Popup;
    Marker: typeof import('react-leaflet').Marker;
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
          Marker: reactLeaflet.Marker,
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

  // Get size based on magnitude
  const getMagnitudeSize = (magnitude: number): number => {
    return Math.max(8, Math.min(30, Math.pow(2, magnitude) * 1.5));
  };

  if (!mapReady || !leaflet) {
    return (
      <div className={`w-full min-h-[250px] bg-neutral-900/50 rounded-xl flex items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Circle, Popup } = leaflet;
  const mainColor = getMagnitudeColor(earthquake.magnitude);
  const mainSize = getMagnitudeSize(earthquake.magnitude);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[earthquake.latitude, earthquake.longitude]}
        zoom={11}
        className="w-full h-full min-h-[250px] rounded-xl z-0"
        style={{ background: '#1a1a1a' }}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={true}
      >
        {/* Dark mode tile layer - CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Nearby earthquakes (dimmed) */}
        {nearbyEarthquakes
          .filter(eq => eq.id !== earthquake.id)
          .map((eq, idx) => (
            <CircleMarker
              key={`${eq.id}-${idx}`}
              center={[eq.latitude, eq.longitude]}
              radius={getMagnitudeSize(eq.magnitude) * 0.6}
              pathOptions={{
                color: getMagnitudeColor(eq.magnitude),
                fillColor: getMagnitudeColor(eq.magnitude),
                fillOpacity: 0.3,
                weight: 1,
                opacity: 0.5,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold" style={{ color: getMagnitudeColor(eq.magnitude) }}>
                    M{eq.magnitude.toFixed(1)}
                  </div>
                  <div className="text-gray-600">{eq.place}</div>
                  <div className="text-xs text-gray-400">
                    {format(eq.time, 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getDistanceKm(earthquake.latitude, earthquake.longitude, eq.latitude, eq.longitude).toFixed(1)} km away
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        
        {/* Epicenter radius indicator */}
        <Circle
          center={[earthquake.latitude, earthquake.longitude]}
          radius={5000}
          pathOptions={{
            color: mainColor,
            fillColor: mainColor,
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '5, 5',
          }}
        />
        
        {/* Main earthquake marker - Pulsing effect */}
        <CircleMarker
          center={[earthquake.latitude, earthquake.longitude]}
          radius={mainSize * 1.5}
          pathOptions={{
            color: mainColor,
            fillColor: mainColor,
            fillOpacity: 0.2,
            weight: 0,
          }}
        />
        
        {/* Main earthquake marker - Core */}
        <CircleMarker
          center={[earthquake.latitude, earthquake.longitude]}
          radius={mainSize}
          pathOptions={{
            color: '#ffffff',
            fillColor: mainColor,
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: mainColor }}
                >
                  {earthquake.magnitude.toFixed(1)}
                </div>
                <div>
                  <div className="font-semibold">Epicenter</div>
                  <div className="text-xs text-gray-500">
                    {format(earthquake.time, 'PPpp')}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-700 mb-2">{earthquake.place}</div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Depth: {earthquake.depth.toFixed(1)} km</div>
                <div>Lat: {earthquake.latitude.toFixed(4)}°</div>
                <div>Lon: {earthquake.longitude.toFixed(4)}°</div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
      
      {/* Coordinates overlay */}
      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
        <div className="text-xs text-neutral-400">
          <span className="font-mono">{earthquake.latitude.toFixed(4)}°N, {earthquake.longitude.toFixed(4)}°W</span>
        </div>
      </div>

      {/* Depth indicator */}
      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
        <div className="text-xs text-neutral-400">
          Depth: <span className="text-white font-medium">{earthquake.depth.toFixed(1)} km</span>
        </div>
      </div>
      
      {/* Legend for nearby quakes */}
      {nearbyEarthquakes.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Nearby Events</div>
          <div className="text-xs text-neutral-300">{nearbyEarthquakes.length - 1} earthquakes</div>
        </div>
      )}
    </div>
  );
}

export { getDistanceKm };

