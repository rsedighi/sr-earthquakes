'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeatureCollection, LineString } from 'geojson';
import type { MapLayerMouseEvent, Popup } from 'maplibre-gl';
import { Loader2 } from 'lucide-react';
import { useMapLibre } from './map/maplibre';
import { MapPopup } from './map/map-popup';

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

// Bay Area cities for reference
const CITIES = [
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

const faults = faultData as unknown as FeatureCollection<LineString, FaultProperties>;
const faultsById = new Map(faults.features.map(f => [f.properties.id, f.properties]));

const RISK_BADGE = {
  'Very High': { background: '#fecaca', color: '#991b1b' },
  High: { background: '#fed7aa', color: '#9a3412' },
  Moderate: { background: '#fef3c7', color: '#92400e' },
} as const;

export function FaultMap({ className = '', height = '400px' }: FaultMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ fault: FaultProperties; lngLat: [number, number] } | null>(null);
  const { map, maplibre, state } = useMapLibre(
    containerRef,
    { center: [-122.15, 37.75], zoom: 8 },
    { component: 'fault-map' },
  );

  useEffect(() => {
    if (!map || !maplibre) return;
    map.addSource('faults', { type: 'geojson', data: faults });
    map.addSource('cities', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: CITIES.map(c => ({ type: 'Feature', properties: { name: c.name }, geometry: { type: 'Point', coordinates: [c.lon, c.lat] } })),
      },
    });
    map.addLayer({
      id: 'faults', type: 'line', source: 'faults',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#ef4444'],
        'line-width': ['match', ['get', 'risk'], 'Very High', 5, 'High', 4, 3],
        'line-opacity': 0.85,
      },
    });
    // Wide invisible line makes thin faults easy to hover and tap.
    map.addLayer({
      id: 'faults-hit', type: 'line', source: 'faults',
      paint: { 'line-color': '#000000', 'line-width': 16, 'line-opacity': 0 },
    });
    map.addLayer({
      id: 'cities', type: 'circle', source: 'cities',
      paint: { 'circle-radius': 4, 'circle-color': '#ffffff', 'circle-opacity': 0.9, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 },
    });
    map.addLayer({
      id: 'city-labels', type: 'symbol', source: 'cities',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Medium'],
        'text-size': 11,
        'text-anchor': 'left',
        'text-offset': [0.7, 0],
      },
      paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.9)', 'text-halo-width': 1.5 },
    });

    let tooltip: Popup | null = null;
    const onMove = (e: MapLayerMouseEvent) => {
      const fault = faultsById.get(e.features?.[0]?.properties?.id);
      if (!fault) return;
      map.getCanvas().style.cursor = 'pointer';
      tooltip ??= new maplibre.Popup({ closeButton: false, closeOnClick: false, className: 'fault-tooltip', offset: 10, anchor: 'bottom' });
      tooltip.setLngLat(e.lngLat).setText(fault.name).addTo(map);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      tooltip?.remove();
    };
    const onClick = (e: MapLayerMouseEvent) => {
      const fault = faultsById.get(e.features?.[0]?.properties?.id);
      if (!fault) return;
      setSelected({ fault, lngLat: [e.lngLat.lng, e.lngLat.lat] });
      map.easeTo({ center: e.lngLat, duration: 400 });
    };
    map.on('mousemove', 'faults-hit', onMove);
    map.on('mouseleave', 'faults-hit', onLeave);
    map.on('click', 'faults-hit', onClick);
    return () => {
      map.off('mousemove', 'faults-hit', onMove);
      map.off('mouseleave', 'faults-hit', onLeave);
      map.off('click', 'faults-hit', onClick);
      tooltip?.remove();
    };
  }, [map, maplibre]);

  const yearsSince = selected ? new Date().getFullYear() - selected.fault.lastMajor.year : 0;

  return (
    <div className={`relative w-full overflow-hidden bg-[#121212] ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {state !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
          {state === 'error'
            ? <p className="text-sm text-neutral-400">Map temporarily unavailable</p>
            : <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />}
        </div>
      )}

      {map && maplibre && selected && (
        <MapPopup
          map={map}
          maplibre={maplibre}
          lngLat={selected.lngLat}
          onClose={() => setSelected(null)}
          className="popup-light"
        >
          <div className="min-w-[240px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: selected.fault.color }} />
              <strong className="text-sm">{selected.fault.name}</strong>
            </div>
            <div
              className="inline-block mb-2 px-2 py-0.5 rounded text-[11px] font-semibold"
              style={RISK_BADGE[selected.fault.risk]}
            >
              {selected.fault.risk} Risk
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-snug">{selected.fault.description}</p>
            <div className="bg-gray-50 rounded-md p-2.5 mt-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Last Major Event (M6+)</div>
              <div className="text-lg font-semibold" style={{ color: selected.fault.color }}>
                M{selected.fault.lastMajor.magnitude.toFixed(1)}
              </div>
              <div className="text-xs text-gray-700 mt-0.5">
                {selected.fault.lastMajor.location}, {selected.fault.lastMajor.year}
              </div>
              <div
                className="text-[11px] font-semibold mt-1"
                style={{ color: yearsSince >= 100 ? '#ef4444' : yearsSince >= 50 ? '#f97316' : '#eab308' }}
              >
                {yearsSince} years ago
              </div>
            </div>
          </div>
        </MapPopup>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-10">
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
      <div className="absolute bottom-10 right-2 text-[10px] text-neutral-400 bg-black/60 px-1.5 py-0.5 rounded z-10">
        Data: USGS Quaternary Fault Database
      </div>
    </div>
  );
}

export default FaultMap;
