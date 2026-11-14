'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import type { FeatureCollection } from 'geojson';
import type { ExpressionSpecification, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import type { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, Navigation } from 'lucide-react';
import { formatDistance, formatDepth, formatDistanceBoth } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
import { getLocationContext } from '@/lib/regions';
import { getDistanceKm } from './address-search';
import { circlePolygon, useMapLibre } from './map/maplibre';
import { MapPopup } from './map/map-popup';

// Quick-zoom region presets for Bay Area (MapLibre zoom levels: 512px tiles)
const REGION_PRESETS = [
  { id: 'all', label: 'Bay Area', center: [-122.0, 37.75] as [number, number], zoom: 8 },
  { id: 'san-ramon', label: 'San Ramon', center: [-121.97, 37.78] as [number, number], zoom: 10 },
  { id: 'east-bay', label: 'East Bay', center: [-122.26, 37.82] as [number, number], zoom: 9 },
  { id: 'sf', label: 'SF', center: [-122.42, 37.77] as [number, number], zoom: 10 },
  { id: 'south-bay', label: 'South Bay', center: [-121.89, 37.33] as [number, number], zoom: 9 },
];
const FOCUS_ZOOM = 11;
// Core Bay Area (SF to the Tri-Valley, Fairfield to San Jose) for the overview.
const BAY_AREA_VIEW: [[number, number], [number, number]] = [[-122.55, 37.25], [-121.7, 38.1]];

interface QuakeMapProps {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake | null;
  onSelectEarthquake?: (eq: Earthquake | null) => void;
  userLocation?: { lat: number; lon: number; address: string } | null;
  searchRadius?: number; // in km
  showOnlyFelt?: boolean;
  className?: string;
  initialRegion?: string; // Region ID to auto-center on (e.g., 'san-ramon')
}

// Get size based on magnitude - exponential scaling for better visual distinction
function getMagnitudeSize(magnitude: number | null | undefined): number {
  if (magnitude == null || isNaN(magnitude)) return 5;
  if (magnitude >= 5) return 30;
  if (magnitude >= 4) return 22;
  if (magnitude >= 3) return 16;
  if (magnitude >= 2) return 11;
  if (magnitude >= 1) return 7;
  return 5;
}

function quakeDate(eq: Earthquake): Date {
  return eq.time instanceof Date && !isNaN(eq.time.getTime()) ? eq.time : new Date(eq.timestamp || Date.now());
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const SELECTED: ExpressionSpecification = ['boolean', ['get', 'selected'], false];
const HIGHLIGHTED: ExpressionSpecification = ['any', ['boolean', ['feature-state', 'hover'], false], SELECTED];

export function QuakeMap({
  earthquakes,
  selectedEarthquake,
  onSelectEarthquake,
  userLocation,
  searchRadius = 25,
  showOnlyFelt = false,
  className = '',
  initialRegion,
}: QuakeMapProps) {
  const { unitSystem } = useUnits();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRegion, setActiveRegion] = useState(() =>
    initialRegion && REGION_PRESETS.some(p => p.id === initialRegion) ? initialRegion : 'all',
  );
  const [minMagnitudeFilter, setMinMagnitudeFilter] = useState<number | null>(null);
  const [popup, setPopup] = useState<{ kind: 'quake'; quake: Earthquake } | { kind: 'user' } | null>(null);

  const initialPreset = REGION_PRESETS.find(p => p.id === activeRegion) ?? REGION_PRESETS[0];
  const { map, maplibre, state } = useMapLibre(
    containerRef,
    userLocation
      ? { center: [userLocation.lon, userLocation.lat], zoom: FOCUS_ZOOM }
      : initialPreset.id === 'all'
        ? { bounds: BAY_AREA_VIEW, fitBoundsOptions: { padding: 16 } }
        : { center: initialPreset.center, zoom: initialPreset.zoom },
    { component: 'quake-map', earthquakeCount: earthquakes.length },
  );

  // Filter earthquakes based on settings
  const displayedQuakes = useMemo(() => {
    let filtered = earthquakes;
    if (showOnlyFelt) {
      filtered = filtered.filter(eq => eq.felt && eq.felt > 0);
    }
    if (userLocation && searchRadius) {
      filtered = filtered.filter(eq =>
        getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude) <= searchRadius,
      );
    }
    if (minMagnitudeFilter !== null) {
      filtered = filtered.filter(eq => eq.magnitude >= minMagnitudeFilter);
    }
    return filtered;
  }, [earthquakes, showOnlyFelt, userLocation, searchRadius, minMagnitudeFilter]);

  const quakesById = useRef(new Map<string, Earthquake>());
  const selectedRef = useRef(selectedEarthquake);
  selectedRef.current = selectedEarthquake;
  const onSelectRef = useRef(onSelectEarthquake);
  onSelectRef.current = onSelectEarthquake;

  // Sources, layers, and interaction handlers (once per map instance)
  useEffect(() => {
    if (!map) return;
    map.addSource('search-radius', { type: 'geojson', data: EMPTY });
    map.addSource('user-location', { type: 'geojson', data: EMPTY });
    map.addSource('quakes', { type: 'geojson', data: EMPTY, promoteId: 'id' });

    map.addLayer({
      id: 'search-radius-fill', type: 'fill', source: 'search-radius',
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 },
    });
    map.addLayer({
      id: 'search-radius-line', type: 'line', source: 'search-radius',
      paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [2.5, 2.5] },
    });
    map.addLayer({
      id: 'quakes', type: 'circle', source: 'quakes',
      layout: { 'circle-sort-key': ['get', 'mag'] },
      paint: {
        'circle-radius': ['*', ['get', 'radius'], ['case', HIGHLIGHTED, 1.3, 1]],
        'circle-color': ['get', 'color'],
        'circle-opacity': ['case', HIGHLIGHTED, 0.9, 0.6],
        'circle-stroke-color': ['case', SELECTED, '#ffffff', ['get', 'color']],
        'circle-stroke-width': ['case', SELECTED, 3, 1],
      },
    });
    map.addLayer({
      id: 'user-location', type: 'circle', source: 'user-location',
      paint: { 'circle-radius': 10, 'circle-color': '#3b82f6', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 },
    });

    let hoveredId: string | null = null;
    const setHover = (id: string | null) => {
      if (hoveredId) map.setFeatureState({ source: 'quakes', id: hoveredId }, { hover: false });
      hoveredId = id;
      if (id) map.setFeatureState({ source: 'quakes', id }, { hover: true });
      map.getCanvas().style.cursor = id ? 'pointer' : '';
    };
    const onMove = (e: MapLayerMouseEvent) => setHover((e.features?.[0]?.id as string | undefined) ?? null);
    const onLeave = () => setHover(null);
    const onQuakeClick = (e: MapLayerMouseEvent) => {
      const quake = quakesById.current.get(String(e.features?.[0]?.id));
      if (!quake) return;
      const isSelected = selectedRef.current?.id === quake.id;
      onSelectRef.current?.(isSelected ? null : quake);
      setPopup({ kind: 'quake', quake });
    };
    const onUserClick = () => setPopup({ kind: 'user' });
    const onUserEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onUserLeave = () => { map.getCanvas().style.cursor = ''; };

    map.on('mousemove', 'quakes', onMove);
    map.on('mouseleave', 'quakes', onLeave);
    map.on('click', 'quakes', onQuakeClick);
    map.on('click', 'user-location', onUserClick);
    map.on('mouseenter', 'user-location', onUserEnter);
    map.on('mouseleave', 'user-location', onUserLeave);
    return () => {
      map.off('mousemove', 'quakes', onMove);
      map.off('mouseleave', 'quakes', onLeave);
      map.off('click', 'quakes', onQuakeClick);
      map.off('click', 'user-location', onUserClick);
      map.off('mouseenter', 'user-location', onUserEnter);
      map.off('mouseleave', 'user-location', onUserLeave);
    };
  }, [map]);

  // Earthquake markers
  useEffect(() => {
    if (!map) return;
    quakesById.current = new Map(displayedQuakes.map(eq => [eq.id, eq]));
    (map.getSource('quakes') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: displayedQuakes.map(eq => ({
        type: 'Feature',
        properties: {
          id: eq.id,
          mag: eq.magnitude ?? 0,
          color: getMagnitudeColor(eq.magnitude),
          radius: getMagnitudeSize(eq.magnitude),
          selected: selectedEarthquake?.id === eq.id,
        },
        geometry: { type: 'Point', coordinates: [eq.longitude, eq.latitude] },
      })),
    });
  }, [map, displayedQuakes, selectedEarthquake?.id]);

  // User location marker and search radius
  useEffect(() => {
    if (!map) return;
    const point: FeatureCollection = userLocation
      ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [userLocation.lon, userLocation.lat] } }] }
      : EMPTY;
    const radius: FeatureCollection = userLocation && searchRadius
      ? { type: 'FeatureCollection', features: [circlePolygon(userLocation.lon, userLocation.lat, searchRadius)] }
      : EMPTY;
    (map.getSource('user-location') as GeoJSONSource | undefined)?.setData(point);
    (map.getSource('search-radius') as GeoJSONSource | undefined)?.setData(radius);
  }, [map, userLocation, searchRadius]);

  // Programmatic navigation: region presets and the selected location.
  // The map is created at the initial region/location, so only fly on changes.
  const lastRegion = useRef(activeRegion);
  useEffect(() => {
    if (!map || lastRegion.current === activeRegion) return;
    lastRegion.current = activeRegion;
    const preset = REGION_PRESETS.find(p => p.id === activeRegion);
    if (preset) map.flyTo({ center: preset.center, zoom: preset.zoom, duration: 800 });
  }, [map, activeRegion]);

  const focusKey = userLocation ? `${userLocation.lat},${userLocation.lon}` : null;
  const lastFocus = useRef(focusKey);
  useEffect(() => {
    if (!map || !userLocation || lastFocus.current === focusKey) return;
    lastFocus.current = focusKey;
    map.flyTo({ center: [userLocation.lon, userLocation.lat], zoom: FOCUS_ZOOM, duration: 800 });
  }, [map, focusKey]);

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && map) {
      map.flyTo({ center: [userLocation.lon, userLocation.lat], zoom: FOCUS_ZOOM, duration: 800 });
      lastRegion.current = '';
      setActiveRegion(''); // Deselect preset buttons
    }
  }, [userLocation, map]);

  const closePopup = useCallback(() => setPopup(null), []);

  return (
    <div data-map-state={state} className={`relative w-full rounded-xl overflow-hidden bg-[#121212] ${className}`}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {state !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
          {state === 'error'
            ? <p className="text-sm text-neutral-400">Map temporarily unavailable</p>
            : <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />}
        </div>
      )}

      {map && maplibre && popup?.kind === 'user' && userLocation && (
        <MapPopup map={map} maplibre={maplibre} lngLat={[userLocation.lon, userLocation.lat]} onClose={closePopup}>
          <div className="text-sm">
            <div className="font-semibold">Your Location</div>
            <div className="text-neutral-400">{userLocation.address}</div>
          </div>
        </MapPopup>
      )}

      {map && maplibre && popup?.kind === 'quake' && (() => {
        const eq = popup.quake;
        const d = quakeDate(eq);
        return (
          <MapPopup map={map} maplibre={maplibre} lngLat={[eq.longitude, eq.latitude]} onClose={closePopup}>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getMagnitudeColor(eq.magnitude) }}
                >
                  {typeof eq.magnitude === 'number' && !isNaN(eq.magnitude) && eq.magnitude > 0
                    ? eq.magnitude.toFixed(1)
                    : '—'}
                </div>
                <div>
                  <div className="font-semibold text-sm">{getMagnitudeLabel(eq.magnitude)}</div>
                  <div className="text-xs text-neutral-400">{formatDistanceToNow(d, { addSuffix: true })}</div>
                </div>
              </div>
              <div className="text-sm text-neutral-200 mb-2">{getLocationContext(eq.latitude, eq.longitude, unitSystem).formattedLocation || eq.place}</div>
              <div className="text-xs text-neutral-400 space-y-1">
                <div>Depth: {formatDepth(eq.depth, unitSystem)}</div>
                <div>Time: {format(d, 'PPpp')}</div>
                {eq.felt && eq.felt > 0 && (
                  <div className="text-amber-400 font-medium">
                    👋 {eq.felt} {eq.felt === 1 ? 'person' : 'people'} felt this
                  </div>
                )}
                {userLocation && (
                  <div className="text-blue-400">
                    📍 {formatDistance(getDistanceKm(userLocation.lat, userLocation.lon, eq.latitude, eq.longitude), unitSystem)} from you
                  </div>
                )}
              </div>
              <a
                href={eq.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-blue-400 hover:text-blue-300"
              >
                View on USGS →
              </a>
            </div>
          </MapPopup>
        );
      })()}

      {/* Center on my location */}
      {userLocation && (
        <button
          onClick={handleCenterOnUser}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/70 text-blue-400 hover:bg-black/90 hover:text-blue-300 backdrop-blur-sm transition-all shadow-lg"
          title="Center on my location"
          aria-label="Center map on my location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      )}

      {/* Stats overlay - only show when user has selected a location */}
      {userLocation && (
        <div className="absolute top-3 left-14 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
          <div className="text-xs text-neutral-400">
            <span className="text-white font-medium">{displayedQuakes.length}</span> earthquakes
            {showOnlyFelt && <span className="text-amber-400 ml-1">felt</span>}
            <span className="text-blue-400 ml-1">within {formatDistanceBoth(searchRadius, unitSystem)}</span>
          </div>
        </div>
      )}

      {/* Interactive Magnitude Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-10">
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
