'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Import the fault data (stored in lib/ to avoid being processed as earthquake data)
import faultData from '@/lib/bay-area-faults.json';

// Type for fault properties
interface FaultProperties {
  name: string;
  id: string;
  risk: 'Very High' | 'High' | 'Moderate';
  color: string;
  lastMajor: {
    year: number;
    magnitude: number;
    location: string;
  };
  description: string;
}

interface FaultMapProps {
  className?: string;
  height?: string;
}

export function FaultMap({ className = '', height = '400px' }: FaultMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [leaflet, setLeaflet] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer;
    TileLayer: typeof import('react-leaflet').TileLayer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
    CircleMarker: typeof import('react-leaflet').CircleMarker;
    Tooltip: typeof import('react-leaflet').Tooltip;
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

      const reactLeaflet = await import('react-leaflet');

      if (mounted) {
        setLeaflet({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          GeoJSON: reactLeaflet.GeoJSON,
          CircleMarker: reactLeaflet.CircleMarker,
          Tooltip: reactLeaflet.Tooltip,
        });
        setMapReady(true);
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
    };
  }, []);

  // Style function for fault lines - memoized
  const faultStyle = useCallback((feature: GeoJSON.Feature | undefined) => {
    if (!feature?.properties) return {};
    const props = feature.properties as FaultProperties;
    return {
      color: props.color || '#ef4444',
      weight: props.risk === 'Very High' ? 5 : props.risk === 'High' ? 4 : 3,
      opacity: 0.85,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    };
  }, []);

  // Popup content for each fault - memoized
  const onEachFault = useCallback((feature: GeoJSON.Feature, layer: L.Layer) => {
    if (!feature.properties) return;
    const props = feature.properties as FaultProperties;
    const yearsSince = new Date().getFullYear() - props.lastMajor.year;
    
    const popupContent = `
      <div style="min-width: 240px; font-family: system-ui, sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${props.color};"></div>
          <strong style="font-size: 14px;">${props.name}</strong>
        </div>
        <div style="background: ${props.risk === 'Very High' ? '#fecaca' : props.risk === 'High' ? '#fed7aa' : '#fef3c7'}; 
                    color: ${props.risk === 'Very High' ? '#991b1b' : props.risk === 'High' ? '#9a3412' : '#92400e'}; 
                    padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 8px;">
          ${props.risk} Risk
        </div>
        <p style="font-size: 12px; color: #4b5563; margin: 0 0 12px 0; line-height: 1.4;">
          ${props.description}
        </p>
        <div style="background: #f9fafb; border-radius: 6px; padding: 10px; margin-top: 8px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">Last Major Event (M6+)</div>
          <div style="font-size: 18px; font-weight: 600; color: ${props.color};">
            M${props.lastMajor.magnitude.toFixed(1)}
          </div>
          <div style="font-size: 12px; color: #374151; margin-top: 2px;">
            ${props.lastMajor.location}, ${props.lastMajor.year}
          </div>
          <div style="font-size: 11px; color: ${yearsSince >= 100 ? '#ef4444' : yearsSince >= 50 ? '#f97316' : '#eab308'}; font-weight: 600; margin-top: 4px;">
            ${yearsSince} years ago
          </div>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent, { maxWidth: 280 });
    
    // Add tooltip with fault name on hover
    layer.bindTooltip(props.name, {
      permanent: false,
      direction: 'top',
      className: 'fault-tooltip',
    });
  }, []);

  if (!mapReady || !leaflet) {
    return (
      <div 
        className={`w-full bg-neutral-900/50 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  const { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } = leaflet;

  // Bay Area cities for reference
  const cities = [
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'Oakland', lat: 37.8044, lon: -122.2712 },
    { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
    { name: 'Berkeley', lat: 37.8716, lon: -122.2727 },
    { name: 'Fremont', lat: 37.5485, lon: -121.9886 },
    { name: 'San Ramon', lat: 37.7799, lon: -121.9780 },
    { name: 'Hayward', lat: 37.6688, lon: -122.0808 },
    { name: 'Concord', lat: 37.9780, lon: -122.0311 },
    { name: 'Santa Rosa', lat: 38.4404, lon: -122.7141 },
    { name: 'Napa', lat: 38.2975, lon: -122.2869 },
  ];

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={[37.75, -122.15]}
        zoom={9}
        className="w-full h-full z-0"
        style={{ background: '#1a1a1a' }}
        scrollWheelZoom={true}
      >
        {/* Dark mode tile layer - CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* GeoJSON fault lines */}
        <GeoJSON
          key="fault-lines"
          data={faultData as GeoJSON.FeatureCollection}
          style={faultStyle}
          onEachFeature={onEachFault}
        />

        {/* City markers */}
        {cities.map((city) => (
          <CircleMarker
            key={city.name}
            center={[city.lat, city.lon]}
            radius={4}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#ffffff',
              fillOpacity: 0.9,
              weight: 1,
            }}
          >
            <Tooltip
              permanent
              direction="right"
              offset={[6, 0]}
              className="city-label"
            >
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 500,
                color: '#ffffff',
                textShadow: '0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }}>
                {city.name}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-[1000]">
        <div className="text-neutral-400 mb-2 font-medium">Fault Risk Level</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 rounded" style={{ height: '5px', background: '#ef4444' }} />
            <span className="text-neutral-400">Very High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 rounded" style={{ height: '4px', background: '#f97316' }} />
            <span className="text-neutral-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 rounded" style={{ height: '3px', background: '#a855f7' }} />
            <span className="text-neutral-400">Moderate</span>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 right-4 text-[10px] text-neutral-600 z-[1000]">
        Data: USGS Quaternary Fault Database
      </div>
      
      {/* Custom tooltip styles */}
      <style jsx global>{`
        .fault-tooltip {
          background: rgba(0, 0, 0, 0.85) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 4px !important;
          color: white !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding: 4px 8px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        }
        .fault-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.85) !important;
        }
        .city-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .city-label::before {
          display: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
        .leaflet-popup-close-button {
          color: #6b7280 !important;
          font-size: 18px !important;
          padding: 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #111827 !important;
        }
      `}</style>
    </div>
  );
}

export default FaultMap;

