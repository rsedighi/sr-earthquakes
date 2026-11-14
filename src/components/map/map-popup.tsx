'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapLibre } from './maplibre';

interface MapPopupProps {
  map: MapLibreMap;
  maplibre: MapLibre;
  lngLat: [number, number];
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

/** A MapLibre popup whose content is rendered by React. */
export function MapPopup({ map, maplibre, lngLat, onClose, children, maxWidth = '280px', className }: MapPopupProps) {
  const [node] = useState(() => document.createElement('div'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [lng, lat] = lngLat;

  useEffect(() => {
    const popup = new maplibre.Popup({ maxWidth, offset: 14, className, focusAfterOpen: false })
      .setLngLat([lng, lat])
      .setDOMContent(node)
      .addTo(map);
    const handleClose = () => onCloseRef.current();
    popup.on('close', handleClose);
    return () => {
      popup.off('close', handleClose);
      popup.remove();
    };
  }, [map, maplibre, node, lng, lat, maxWidth, className]);

  return createPortal(children, node);
}
