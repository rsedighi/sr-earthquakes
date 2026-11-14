'use client';

import { useEffect, useRef, useState } from 'react';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import type { Earthquake } from '@/lib/types';
import { getMagnitudeColor } from '@/lib/analysis';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDepth, formatDistance } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
import { getLocationContext } from '@/lib/regions';
import { getDistanceKm } from './address-search';
import { BASEMAP_BOUNDS, circlePolygon, inBasemap, useMapLibre } from './map/maplibre';
import { MapPopup } from './map/map-popup';

interface EarthquakeDetailMapProps {
  earthquake: Earthquake;
  nearbyEarthquakes?: Earthquake[];
  className?: string;
}

// Get size based on magnitude
function getMagnitudeSize(magnitude: number): number {
  return Math.max(8, Math.min(30, Math.pow(2, magnitude) * 1.5));
}

export function EarthquakeDetailMap({
  earthquake,
  nearbyEarthquakes = [],
  className = '',
}: EarthquakeDetailMapProps) {
  const { unitSystem } = useUnits();
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupQuake, setPopupQuake] = useState<Earthquake | null>(null);
  const { map, maplibre, state } = useMapLibre(
    containerRef,
    {
      center: [earthquake.longitude, earthquake.latitude],
      zoom: 10,
      scrollZoom: false,
      maxBounds: inBasemap(earthquake.longitude, earthquake.latitude) ? BASEMAP_BOUNDS : undefined,
    },
    { component: 'earthquake-detail-map', earthquakeCount: nearbyEarthquakes.length },
  );

  const nearbyRef = useRef(nearbyEarthquakes);
  nearbyRef.current = nearbyEarthquakes;
  const mainRef = useRef(earthquake);
  mainRef.current = earthquake;

  useEffect(() => {
    if (!map) return;
    const mainColor = getMagnitudeColor(earthquake.magnitude);
    const mainSize = getMagnitudeSize(earthquake.magnitude);
    const center: [number, number] = [earthquake.longitude, earthquake.latitude];
    const nearby = nearbyEarthquakes.filter(eq => eq.id !== earthquake.id);

    map.addSource('epicenter-radius', { type: 'geojson', data: circlePolygon(center[0], center[1], 5) });
    map.addSource('nearby', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: nearby.map(eq => ({
          type: 'Feature',
          properties: { id: eq.id, color: getMagnitudeColor(eq.magnitude), radius: getMagnitudeSize(eq.magnitude) * 0.6 },
          geometry: { type: 'Point', coordinates: [eq.longitude, eq.latitude] },
        })),
      },
    });
    map.addSource('epicenter', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: center } },
    });

    map.addLayer({ id: 'epicenter-radius-fill', type: 'fill', source: 'epicenter-radius', paint: { 'fill-color': mainColor, 'fill-opacity': 0.1 } });
    map.addLayer({ id: 'epicenter-radius-line', type: 'line', source: 'epicenter-radius', paint: { 'line-color': mainColor, 'line-width': 1, 'line-dasharray': [5, 5] } });
    map.addLayer({
      id: 'nearby', type: 'circle', source: 'nearby',
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.3,
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.5,
      },
    });
    map.addLayer({ id: 'epicenter-halo', type: 'circle', source: 'epicenter', paint: { 'circle-radius': mainSize * 1.5, 'circle-color': mainColor, 'circle-opacity': 0.2 } });
    map.addLayer({
      id: 'epicenter', type: 'circle', source: 'epicenter',
      paint: { 'circle-radius': mainSize, 'circle-color': mainColor, 'circle-opacity': 0.9, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 },
    });

    const onNearbyClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id;
      setPopupQuake(nearbyRef.current.find(eq => eq.id === id) ?? null);
    };
    const onEpicenterClick = () => setPopupQuake(mainRef.current);
    const pointer = () => { map.getCanvas().style.cursor = 'pointer'; };
    const reset = () => { map.getCanvas().style.cursor = ''; };
    for (const layer of ['nearby', 'epicenter']) {
      map.on('mouseenter', layer, pointer);
      map.on('mouseleave', layer, reset);
    }
    map.on('click', 'nearby', onNearbyClick);
    map.on('click', 'epicenter', onEpicenterClick);
    return () => {
      for (const layer of ['nearby', 'epicenter']) {
        map.off('mouseenter', layer, pointer);
        map.off('mouseleave', layer, reset);
      }
      map.off('click', 'nearby', onNearbyClick);
      map.off('click', 'epicenter', onEpicenterClick);
    };
    // Props are fixed for the lifetime of a detail view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const mainColor = getMagnitudeColor(earthquake.magnitude);

  return (
    <div className={`relative w-full min-h-[250px] rounded-xl overflow-hidden bg-[#121212] ${className}`}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {state !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
          {state === 'error'
            ? <p className="text-sm text-neutral-400">Map temporarily unavailable</p>
            : <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />}
        </div>
      )}

      {map && maplibre && popupQuake && (
        <MapPopup map={map} maplibre={maplibre} lngLat={[popupQuake.longitude, popupQuake.latitude]} onClose={() => setPopupQuake(null)}>
          {popupQuake.id === earthquake.id ? (
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
                  <div className="text-xs text-neutral-400">
                    {format(earthquake.time, 'PPpp')}
                  </div>
                </div>
              </div>
              <div className="text-sm text-neutral-200 mb-2">{earthquake.place}</div>
              <div className="text-xs text-neutral-400 space-y-1">
                <div>Depth: {formatDepth(earthquake.depth)}</div>
                <div>Lat: {earthquake.latitude.toFixed(4)}°</div>
                <div>Lon: {earthquake.longitude.toFixed(4)}°</div>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="font-bold" style={{ color: getMagnitudeColor(popupQuake.magnitude) }}>
                M{popupQuake.magnitude.toFixed(1)}
              </div>
              <div className="text-neutral-300">{getLocationContext(popupQuake.latitude, popupQuake.longitude, unitSystem).formattedLocation || popupQuake.place}</div>
              <div className="text-xs text-neutral-500">
                {format(popupQuake.time, 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-neutral-400">
                {formatDistance(getDistanceKm(earthquake.latitude, earthquake.longitude, popupQuake.latitude, popupQuake.longitude), unitSystem)} away
              </div>
            </div>
          )}
        </MapPopup>
      )}

      {/* Coordinates overlay */}
      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
        <div className="text-xs text-neutral-400">
          <span className="font-mono">{earthquake.latitude.toFixed(4)}°N, {earthquake.longitude.toFixed(4)}°W</span>
        </div>
      </div>

      {/* Depth indicator */}
      <div className="absolute bottom-14 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
        <div className="text-xs text-neutral-400">
          Depth: <span className="text-white font-medium">{formatDepth(earthquake.depth)}</span>
        </div>
      </div>

      {/* Legend for nearby quakes */}
      {nearbyEarthquakes.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Nearby Events</div>
          <div className="text-xs text-neutral-300">{nearbyEarthquakes.length - 1} earthquakes</div>
        </div>
      )}
    </div>
  );
}

export { getDistanceKm };
