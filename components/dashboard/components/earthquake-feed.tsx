'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Clock, Users, Layers } from 'lucide-react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getRegionById, getLocationContext } from '@/lib/regions';
import { formatDepthDeep } from '@/lib/units';

interface EarthquakeFeedProps {
  earthquakes: Earthquake[];
  onSelect: (eq: Earthquake) => void;
  onMapSelect?: (eq: Earthquake | null) => void;
  selectedId?: string | null;
  isLoading: boolean;
  initialCount?: number;
}

export function EarthquakeFeed({
  earthquakes,
  onSelect,
  onMapSelect,
  selectedId,
  isLoading,
  initialCount = 5,
}: EarthquakeFeedProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Deduplicate earthquakes by ID
  const uniqueQuakes = earthquakes.filter((eq, index, self) => 
    index === self.findIndex(e => e.id === eq.id)
  );
  
  const displayedQuakes = showAll ? uniqueQuakes : uniqueQuakes.slice(0, initialCount);
  const remainingCount = uniqueQuakes.length - initialCount;

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <div className="h-5 w-40 bg-white/[0.06] rounded skeleton" />
        </div>
        <div className="divide-y divide-white/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.04] rounded skeleton" />
                <div className="h-3 w-1/2 bg-white/[0.03] rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (uniqueQuakes.length === 0) {
    return (
      <section className="card p-8 text-center">
        <div className="text-neutral-500">No earthquakes recorded this week</div>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {uniqueQuakes.length} earthquakes this week
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time
        </div>
      </div>
      
      {/* Feed list */}
      <div className="divide-y divide-white/[0.04]">
        {displayedQuakes.map((eq, i) => (
          <EarthquakeRow 
            key={eq.id}
            earthquake={eq}
            isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
            isSelected={selectedId === eq.id}
            onClick={() => onSelect(eq)}
            onMapSelect={() => onMapSelect?.(selectedId === eq.id ? null : eq)}
          />
        ))}
      </div>
      
      {/* Show more / Show less */}
      {remainingCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-5 py-4 text-sm text-neutral-400 hover:text-white hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 border-t border-white/5"
        >
          <span>
            {showAll ? 'Show less' : `Show ${remainingCount} more`}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}

// Individual earthquake row
function EarthquakeRow({ 
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
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude);
  
  return (
    <div 
      className={`flex items-center gap-4 p-4 transition-all cursor-pointer group
        ${isNew ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
        ${isSelected ? 'bg-white/[0.04] ring-1 ring-white/10 ring-inset' : ''}`}
      onClick={onClick}
    >
      {/* Magnitude badge */}
      <div className="flex-shrink-0">
        <div 
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-transform group-hover:scale-[1.02]"
          style={{ 
            backgroundColor: getMagnitudeColor(earthquake.magnitude) + '12',
            border: `1px solid ${getMagnitudeColor(earthquake.magnitude)}25`
          }}
        >
          <span 
            className="text-xl font-light tabular-nums"
            style={{ color: getMagnitudeColor(earthquake.magnitude) }}
          >
            {earthquake.magnitude.toFixed(1)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 -mt-0.5">
            {getMagnitudeLabel(earthquake.magnitude).slice(0, 5)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Location */}
        <div className="font-medium text-white group-hover:text-white/90 truncate">
          {locationContext.formattedLocation || earthquake.place?.split(',')[0] || 'Bay Area'}
        </div>
        
        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(earthquake.time, { addSuffix: true })}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {formatDepthDeep(earthquake.depth)}
          </span>
          {earthquake.felt && earthquake.felt > 0 && (
            <span className="text-amber-400/80 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {earthquake.felt} felt
            </span>
          )}
        </div>
      </div>

      {/* Region badge */}
      {region && (
        <div className="hidden sm:block flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMapSelect?.();
            }}
            className="px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all hover:scale-105"
            style={{ 
              backgroundColor: region.color + '15',
              color: region.color,
              border: `1px solid ${region.color}30`
            }}
            title={`${region.name} • ${region.county} County`}
          >
            {region.areaCode}
          </button>
        </div>
      )}

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0 transition-colors" />
    </div>
  );
}

