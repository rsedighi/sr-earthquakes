'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Clock, Users, Activity, Filter } from 'lucide-react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { getLocationContext } from '@/lib/regions';

// Time filter options
export type TimeFilter = 'hour' | '6hours' | 'today' | 'week' | null;

interface HeroHeaderProps {
  earthquakes: Earthquake[];
  isLoading: boolean;
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  onSelectEarthquake: (eq: Earthquake) => void;
  onViewDetails: (eq: Earthquake) => void;
}

// Client-only time formatting to avoid hydration errors
function useClientTime() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
}

// Format relative time safely (client-only)
function formatRelativeTime(timestamp: number, isMounted: boolean): string {
  if (!isMounted) return '...';
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

// Get urgency level for visual indicator
function getUrgency(timestamp: number, isMounted: boolean): 'hot' | 'warm' | 'normal' {
  if (!isMounted) return 'normal';
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffHours = diffMs / 3600000;
  
  if (diffHours < 1) return 'hot';   // Within last hour
  if (diffHours < 6) return 'warm';  // Within last 6 hours
  return 'normal';
}

export function HeroHeader({
  earthquakes,
  isLoading,
  activeFilter,
  onFilterChange,
  onSelectEarthquake,
  onViewDetails,
}: HeroHeaderProps) {
  const isMounted = useClientTime();
  
  // Calculate filter counts - only on client after mount
  const filterCounts = useMemo(() => {
    if (!isMounted || !earthquakes.length) {
      return { hour: 0, sixHours: 0, today: 0, week: earthquakes.length };
    }
    
    const now = Date.now();
    const hourAgo = now - 3600000;
    const sixHoursAgo = now - 21600000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    
    return {
      hour: earthquakes.filter(eq => eq.timestamp > hourAgo).length,
      sixHours: earthquakes.filter(eq => eq.timestamp > sixHoursAgo).length,
      today: earthquakes.filter(eq => eq.timestamp > todayStartMs).length,
      week: earthquakes.length,
    };
  }, [earthquakes, isMounted]);
  
  // Get most recent earthquake
  const mostRecent = useMemo(() => {
    if (!earthquakes.length) return null;
    return earthquakes.reduce((latest, eq) => 
      eq.timestamp > latest.timestamp ? eq : latest, earthquakes[0]
    );
  }, [earthquakes]);
  
  // Get recent activity (top 4)
  const recentActivity = useMemo(() => {
    return earthquakes.slice(0, 4);
  }, [earthquakes]);
  
  // Loading skeleton
  if (isLoading) {
    return (
      <section className="card p-5 sm:p-6 space-y-5">
        {/* Hero skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.06] skeleton" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 bg-white/[0.06] skeleton rounded" />
            <div className="h-6 w-48 bg-white/[0.04] skeleton rounded" />
            <div className="h-4 w-36 bg-white/[0.03] skeleton rounded" />
          </div>
        </div>
        
        {/* Recent activity skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-36 h-20 rounded-xl bg-white/[0.02] border border-white/5 skeleton" />
          ))}
        </div>
        
        {/* Filters skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 rounded-lg bg-white/[0.03] skeleton" />
          ))}
        </div>
      </section>
    );
  }
  
  const urgency = mostRecent ? getUrgency(mostRecent.timestamp, isMounted) : 'normal';
  const locationContext = mostRecent ? getLocationContext(mostRecent.latitude, mostRecent.longitude) : null;
  
  return (
    <section className={`card overflow-hidden ${
      urgency === 'hot' 
        ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-transparent to-transparent'
        : ''
    }`}>
      {/* Urgency indicator bar */}
      {urgency === 'hot' && (
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-pulse" />
      )}
      
      <div className="p-5 sm:p-6 space-y-5">
        {/* Most Recent Earthquake */}
        {mostRecent && (
          <div 
            className="flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer group"
            onClick={() => onViewDetails(mostRecent)}
          >
            {/* Magnitude Badge */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-transform group-hover:scale-105"
                style={{ 
                  backgroundColor: getMagnitudeColor(mostRecent.magnitude) + '15',
                  border: `2px solid ${getMagnitudeColor(mostRecent.magnitude)}40`,
                }}
              >
                <span 
                  className="text-3xl font-light tabular-nums"
                  style={{ color: getMagnitudeColor(mostRecent.magnitude) }}
                >
                  M{mostRecent.magnitude.toFixed(1)}
                </span>
              </div>
              {urgency === 'hot' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-neutral-900 animate-pulse" />
              )}
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Time badge */}
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    urgency === 'hot' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : urgency === 'warm'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-white/10 text-neutral-300'
                  }`}
                  suppressHydrationWarning
                >
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(mostRecent.timestamp, isMounted)}
                </span>
                {mostRecent.felt && mostRecent.felt > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                    <Users className="w-3 h-3" />
                    {mostRecent.felt} felt
                  </span>
                )}
              </div>
              
              {/* Location */}
              <h2 className="text-xl sm:text-2xl font-semibold text-white group-hover:text-white/90 transition-colors">
                {locationContext?.formattedLocation || mostRecent.place?.split(',')[0] || 'Bay Area'}
              </h2>
              
              {/* Severity label */}
              <p className="text-sm text-neutral-500 mt-0.5">
                {getMagnitudeLabel(mostRecent.magnitude)} earthquake
                {mostRecent.place && (
                  <span className="text-neutral-600"> • {mostRecent.place}</span>
                )}
              </p>
            </div>
            
            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(mostRecent);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-100 transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
            >
              View details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Recent Activity - Quick Browse (4 cards) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-400">Recent Activity</h3>
            <span className="text-xs text-neutral-600">Click any to view</span>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {recentActivity.map((eq, i) => {
              const eqUrgency = getUrgency(eq.timestamp, isMounted);
              return (
                <button
                  key={eq.id}
                  onClick={() => onViewDetails(eq)}
                  className={`flex-shrink-0 w-36 p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    eqUrgency === 'hot'
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div 
                    className="text-xl font-light tabular-nums"
                    style={{ color: getMagnitudeColor(eq.magnitude) }}
                  >
                    {eq.magnitude.toFixed(1)}
                  </div>
                  <div className="text-sm text-white truncate mt-0.5">
                    {eq.place?.split(',')[0] || 'Bay Area'}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1" suppressHydrationWarning>
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(eq.timestamp, isMounted)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
          <Filter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <FilterButton
              label="Last Hour"
              count={filterCounts.hour}
              isActive={activeFilter === 'hour'}
              onClick={() => onFilterChange(activeFilter === 'hour' ? null : 'hour')}
              isMounted={isMounted}
            />
            <FilterButton
              label="Last 6 Hours"
              count={filterCounts.sixHours}
              isActive={activeFilter === '6hours'}
              onClick={() => onFilterChange(activeFilter === '6hours' ? null : '6hours')}
              isMounted={isMounted}
            />
            <FilterButton
              label="Today"
              count={filterCounts.today}
              isActive={activeFilter === 'today'}
              onClick={() => onFilterChange(activeFilter === 'today' ? null : 'today')}
              isMounted={isMounted}
            />
            <FilterButton
              label="This Week"
              count={filterCounts.week}
              isActive={activeFilter === 'week' || activeFilter === null}
              onClick={() => onFilterChange(null)}
              isPrimary
              isMounted={isMounted}
            />
          </div>
        </div>
        
        {/* Helper text */}
        <p className="text-xs text-neutral-600 flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          Felt an earthquake? Click a time filter or browse recent quakes above to find it.
        </p>
      </div>
    </section>
  );
}

// Filter button component
function FilterButton({
  label,
  count,
  isActive,
  onClick,
  isPrimary = false,
  isMounted,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  isPrimary?: boolean;
  isMounted: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? isPrimary
            ? 'bg-white text-black'
            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          : 'bg-white/[0.04] text-neutral-400 border border-white/10 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <span>{label}</span>
      <span 
        className={`px-1.5 py-0.5 rounded text-xs font-bold ${
          isActive
            ? isPrimary
              ? 'bg-black/10 text-black/70'
              : 'bg-blue-500/30 text-blue-200'
            : 'bg-white/10'
        }`}
        suppressHydrationWarning
      >
        {isMounted ? count : '—'}
      </span>
    </button>
  );
}

