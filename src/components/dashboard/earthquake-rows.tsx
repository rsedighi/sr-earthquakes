'use client';

import { Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { Earthquake } from '@/lib/types';
import { getRegionById, getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDepthDeep, formatDistance } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
import { getDistanceKmLocal } from './utils';

export function CompactEarthquakeRow({ 
  earthquake, 
  isNew,
  isSelected,
  onClick,
  userLocation,
}: { 
  earthquake: Earthquake; 
  isNew?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  userLocation?: { lat: number; lon: number } | null;
}) {
  const { unitSystem } = useUnits();
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
  const distanceKm = userLocation 
    ? getDistanceKmLocal(userLocation.lat, userLocation.lon, earthquake.latitude, earthquake.longitude)
    : null;
  
  const minutesAgo = (Date.now() - earthquake.timestamp) / (1000 * 60);
  const isVeryRecent = minutesAgo < 5;
  
  const formattedMag = typeof earthquake.magnitude === 'number' && !isNaN(earthquake.magnitude) && earthquake.magnitude > 0
    ? earthquake.magnitude.toFixed(1)
    : '—';
  
  const timeDate = earthquake.time instanceof Date && !isNaN(earthquake.time.getTime())
    ? earthquake.time
    : new Date(earthquake.timestamp || Date.now());
  
  const formattedTimeAgo = (() => {
    try {
      return formatDistanceToNow(timeDate, { addSuffix: true });
    } catch {
      return 'recently';
    }
  })();
  
  const formattedLocalTime = (() => {
    try {
      return timeDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  })();

  return (
    <button 
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all relative
        ${isVeryRecent ? 'bg-green-500/10 animate-pulse-subtle' : isNew ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}
        ${isSelected ? 'bg-white/[0.06]' : ''}
        ${isVeryRecent ? 'border-l-2 border-green-500' : ''}`}
      onClick={onClick}
    >
      <div 
        className={`text-lg font-light tabular-nums w-10 text-center flex-shrink-0 ${isVeryRecent ? 'animate-bounce-subtle' : ''}`}
        style={{ color: getMagnitudeColor(earthquake.magnitude) }}
      >
        {formattedMag}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate flex items-center gap-2">
          <span>{locationContext.formattedLocation || earthquake.place?.split(',')[0] || 'Bay Area'}</span>
          {isVeryRecent && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse uppercase tracking-wide">
              New
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500 flex items-center gap-2">
          <span suppressHydrationWarning className={isVeryRecent ? 'text-green-400/70' : ''}>
            {formattedTimeAgo}{formattedLocalTime ? ` · ${formattedLocalTime} PST` : ''}
          </span>
          {distanceKm !== null && (
            <span className="text-blue-400/80 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {formatDistance(distanceKm, unitSystem, 0)}
            </span>
          )}
          {earthquake.felt && earthquake.felt > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Users className="w-3 h-3" />
              <span className="font-medium">{earthquake.felt}</span>
            </span>
          )}
        </div>
      </div>

      {isVeryRecent && (
        <span className="relative flex-shrink-0">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}
    </button>
  );
}

export function EarthquakeRow({ 
  earthquake, 
  isNew,
  isSelected,
  onClick,
  onMapSelect
}: { 
  earthquake: Earthquake; 
  isNew?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMapSelect?: () => void;
}) {
  const { unitSystem } = useUnits();
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
  const formattedMag = typeof earthquake.magnitude === 'number' && !isNaN(earthquake.magnitude) && earthquake.magnitude > 0
    ? earthquake.magnitude.toFixed(1)
    : '—';
  
  const timeDate = earthquake.time instanceof Date && !isNaN(earthquake.time.getTime())
    ? earthquake.time
    : new Date(earthquake.timestamp || Date.now());

  const formattedTimeAgo = (() => {
    try {
      return formatDistanceToNow(timeDate, { addSuffix: true });
    } catch {
      return 'recently';
    }
  })();

  return (
    <div 
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left cursor-pointer group
        ${isNew ? 'bg-white/[0.06] border border-white/10' : 'hover:bg-white/[0.03]'}
        ${isSelected ? 'ring-2 ring-white/30 bg-white/[0.03]' : ''}`}
      onClick={onClick}
    >
      <div className="w-14 text-center flex-shrink-0">
        <div 
          className="text-2xl font-light"
          style={{ color: getMagnitudeColor(earthquake.magnitude) }}
        >
          {formattedMag}
        </div>
        <div className="text-[10px] text-neutral-500 uppercase">
          {getMagnitudeLabel(earthquake.magnitude)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {locationContext.formattedLocation || earthquake.place}
        </div>
        {locationContext.formattedLocation && (
          <div className="text-xs text-neutral-500 truncate mt-0.5">
            {earthquake.place}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedTimeAgo}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{formatDepthDeep(earthquake.depth, unitSystem)}</span>
          {earthquake.felt && earthquake.felt > 0 && (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="text-neutral-300 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {earthquake.felt} felt it
              </span>
            </>
          )}
        </div>
      </div>

      {region && (
        <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMapSelect?.();
            }}
            className="px-2 py-1 text-xs font-mono rounded-md hover:scale-105 transition-transform"
            style={{ 
              backgroundColor: region.color + '20',
              color: region.color,
              border: `1px solid ${region.color}40`
            }}
            title={`${region.name} • ${region.county} County`}
          >
            {region.areaCode}
          </button>
        </div>
      )}

      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0 transition-colors" />
    </div>
  );
}
