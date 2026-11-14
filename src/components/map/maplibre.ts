'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Feature, Polygon } from 'geojson';
import type { Map as MapLibreMap, MapOptions, StyleSpecification } from 'maplibre-gl';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { trackAction, trackError } from '@/lib/telemetry';

export type MapLibre = typeof import('maplibre-gl');

// Matches the extract in src/lib/basemap.ts; the camera never leaves the data.
export const BASEMAP_BOUNDS: [[number, number], [number, number]] = [[-123.2, 36.7], [-120.9, 38.6]];

let loader: Promise<MapLibre> | null = null;

export function loadMapLibre(): Promise<MapLibre> {
  loader ??= Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ])
    .then(([maplibre, worker]) => {
      maplibre.setWorkerUrl(new URL(worker.default, window.location.href).href);
      return maplibre;
    })
    .catch((err) => {
      loader = null;
      throw err;
    });
  return loader;
}

const FLAVOR = {
  ...namedFlavor('dark'),
  background: '#121212',
  earth: '#161616',
  water: '#1f2733',
};

export function basemapStyle(): StyleSpecification {
  const origin = window.location.origin;
  return {
    version: 8,
    glyphs: `${origin}/basemap/fonts/{fontstack}/{range}.pbf`,
    sprite: `${origin}/basemap/sprites/dark`,
    sources: {
      protomaps: {
        type: 'vector',
        tiles: [`${origin}/basemap/tiles/{z}/{x}/{y}.mvt`],
        maxzoom: 15,
        bounds: [BASEMAP_BOUNDS[0][0], BASEMAP_BOUNDS[0][1], BASEMAP_BOUNDS[1][0], BASEMAP_BOUNDS[1][1]],
        attribution:
          '<a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
    },
    layers: layers('protomaps', FLAVOR, { lang: 'en' }),
  };
}

export function inBasemap(lon: number, lat: number): boolean {
  const [[minLon, minLat], [maxLon, maxLat]] = BASEMAP_BOUNDS;
  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

// 64-point polygon approximating a geodesic circle, for radius overlays.
export function circlePolygon(lon: number, lat: number, radiusKm: number): Feature<Polygon> {
  const coords: [number, number][] = [];
  const dLat = radiusKm / 110.574;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * 2 * Math.PI;
    coords.push([lon + dLon * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
}

export type MapState = 'loading' | 'ready' | 'error';

/**
 * Creates a MapLibre map in `containerRef` with the self-hosted basemap.
 * `map` is set once the style has loaded, so callers can add sources/layers.
 */
export function useMapLibre(
  containerRef: RefObject<HTMLDivElement | null>,
  options: Omit<MapOptions, 'container' | 'style'>,
  telemetry: { component: string; earthquakeCount?: number },
) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [maplibre, setMaplibre] = useState<MapLibre | null>(null);
  const [state, setState] = useState<MapState>('loading');
  const optionsRef = useRef(options);
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  useEffect(() => {
    let disposed = false;
    let instance: MapLibreMap | null = null;
    let tileFailureTracked = false;

    const fail = (error: Error, phase: string) => {
      trackError(error, { component: telemetryRef.current.component, phase });
      trackAction('map_failed', { phase, message: error.message });
    };

    loadMapLibre()
      .then((lib) => {
        if (disposed || !containerRef.current) return;
        instance = new lib.Map({
          ...optionsRef.current,
          container: containerRef.current,
          style: basemapStyle(),
          maxBounds: 'maxBounds' in optionsRef.current ? optionsRef.current.maxBounds : BASEMAP_BOUNDS,
          attributionControl: { compact: true },
          fadeDuration: 150,
        });
        instance.addControl(new lib.NavigationControl({ showCompass: false }), 'top-left');
        // A few POI icons in the style are absent from the v4 sprite; render them as blank.
        instance.on('styleimagemissing', ({ id }) => {
          if (!instance?.hasImage(id)) instance?.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
        });
        instance.on('error', (event) => {
          console.error('[map]', event.error);
          if (tileFailureTracked) return;
          tileFailureTracked = true;
          fail(event.error instanceof Error ? event.error : new Error(event.error?.message ?? 'Map error'), 'tile_load');
        });
        instance.once('load', () => {
          if (disposed || !instance) return;
          setMaplibre(lib);
          setMap(instance);
          setState('ready');
        });
        instance.once('idle', () => {
          trackAction('map_ready', { earthquakeCount: telemetryRef.current.earthquakeCount ?? 0 });
        });
      })
      .catch((err) => {
        if (disposed) return;
        setState('error');
        fail(err instanceof Error ? err : new Error('Map module failed to load'), 'module_load');
      });

    return () => {
      disposed = true;
      instance?.remove();
      setMap(null);
    };
  }, [containerRef]);

  return { map, maplibre, state };
}
