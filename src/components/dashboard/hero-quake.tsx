'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Zap,
  Users,
  ChevronRight,
  House,
} from 'lucide-react';

import type { Earthquake } from '@/lib/types';
import { getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { useUnits } from '@/lib/unit-context';
import type { MyCityData, MyCityStatsData } from './types';

export function HeroQuake({
  earthquakes,
  onViewDetails,
  myCity,
  myCityStats,
  myCityLoaded,
  onSetCity,
}: {
  earthquakes: Earthquake[];
  onViewDetails: (eq: Earthquake) => void;
  myCity: MyCityData | null;
  myCityStats: MyCityStatsData | null;
  myCityLoaded: boolean;
  onSetCity: () => void;
}) {
  const { unitSystem } = useUnits();
  
  const notableQuake = useMemo(() => {
    return earthquakes.find(eq => eq.magnitude >= 2.0) || earthquakes[0];
  }, [earthquakes]);
  
  const locationContext = notableQuake ? getLocationContext(notableQuake.latitude, notableQuake.longitude, unitSystem) : null;
  
  if (!notableQuake) return null;
  
  const isRecent = Date.now() - notableQuake.timestamp < 60 * 60 * 1000;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
      <button
        onClick={() => onViewDetails(notableQuake)}
        className={`md:col-span-3 card p-4 sm:p-5 text-left group transition-all hover:bg-white/[0.03] ${
          isRecent ? 'ring-1 ring-green-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3 h-3 text-neutral-500" />
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500 font-medium">
            Latest Notable Quake
          </span>
          {isRecent && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 border border-green-500/30">
              Just now
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ 
              backgroundColor: getMagnitudeColor(notableQuake.magnitude) + '20',
              border: `2px solid ${getMagnitudeColor(notableQuake.magnitude)}50`,
            }}
          >
            <span 
              className="text-xl sm:text-2xl font-light"
              style={{ color: getMagnitudeColor(notableQuake.magnitude) }}
            >
              {notableQuake.magnitude.toFixed(1)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              <span className="text-xs text-neutral-500" suppressHydrationWarning>
                {formatDistanceToNow(notableQuake.time, { addSuffix: true })}
              </span>
              {notableQuake.felt && notableQuake.felt > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">{notableQuake.felt} felt</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white truncate group-hover:text-white/90">
              {locationContext?.formattedLocation || notableQuake.place?.split(',')[0] || 'Bay Area'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 truncate">
              {getMagnitudeLabel(notableQuake.magnitude)} earthquake • {notableQuake.place}
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0 transition-colors hidden sm:block" />
        </div>
      </button>
      
      <button
        onClick={onSetCity}
        className="md:col-span-1 card p-4 sm:p-5 text-left group transition-all hover:bg-white/[0.03]"
      >
        {myCityLoaded && myCity ? (
          <div className="flex md:flex-col items-center md:items-start gap-3 sm:gap-4 md:gap-2 h-full">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-lg md:text-base font-bold text-white">
                {myCity.areaCode || '—'}
              </span>
            </div>
            <div className="flex-1 min-w-0 md:flex-none">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">{myCity.cityName}</span>
                {myCityStats?.isElevated && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                <span className="text-neutral-300 font-medium tabular-nums">
                  {myCityStats?.nearbyThisWeek || 0}
                </span>{' '}
                nearby
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 md:hidden" />
          </div>
        ) : (
          <div className="flex md:flex-col items-center md:items-center md:justify-center gap-3 sm:gap-4 md:gap-2 h-full md:py-2">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-white/[0.04] border border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
              <House className="w-6 h-6 md:w-5 md:h-5 text-neutral-500" />
            </div>
            <div className="flex-1 min-w-0 md:flex-none md:text-center">
              <div className="font-medium text-white text-sm">Set Your City</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Get personalized alerts
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 md:hidden" />
          </div>
        )}
      </button>
    </div>
  );
}
