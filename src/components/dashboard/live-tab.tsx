'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import {
  Activity,
  Clock,
  Map,
  ExternalLink,
  Users,
  Zap,
  Flame,
  Target,
  Layers,
  Sparkles,
  MapPin,
  Loader2,
  X,
} from 'lucide-react';

import type { Earthquake } from '@/lib/types';
import { getLocationContext } from '@/lib/regions';
import { getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDepth, formatRadius, getDepthDescription } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
import { CommunityWidget } from '@/components/bay-tremor-community';
import { AffiliateShowcase } from '@/components/affiliate-recommendations';
import type { MagnitudeFilter, HotspotRegion, HistoricalSummary, MyCityData, MyCityStatsData } from './types';
import { deduplicateEarthquakes } from './utils';
import { CompactEarthquakeRow } from './earthquake-rows';
import { CollapsibleAlert } from './collapsible-alert';
import { HeroQuake } from './hero-quake';
import { IOSAppBanner } from './prompts';

const LeafletMap = dynamic(
  () => import('@/components/leaflet-map').then(mod => mod.LeafletMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-[#0a0a0a] rounded-xl relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-4 left-4 w-8 h-16 bg-white/5 border border-white/10 rounded-md animate-pulse z-10"></div>
        <div className="absolute top-4 right-4 w-32 h-10 bg-white/5 border border-white/10 rounded-xl animate-pulse z-10"></div>
        <div className="absolute bottom-6 right-4 w-24 h-6 bg-white/5 border border-white/10 rounded animate-pulse z-10"></div>
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
      </div>
    )
  }
);

function WeeklyContextBanner({
  weekCount,
  largestRecent,
  last24HoursCount,
  feltCount,
}: {
  weekCount: number;
  largestRecent: Earthquake | null;
  last24HoursCount: number;
  feltCount: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem('baytremor-weekly-ctx-dismissed')) {
      setDismissed(true);
    }
  }, []);

  if (!mounted || dismissed || weekCount === 0) return null;

  const hasSignificant = largestRecent && largestRecent.magnitude >= 4.0;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
      hasSignificant
        ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-white/[0.03] border-white/10'
    }`}>
      <Activity className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
        hasSignificant ? 'text-amber-400' : 'text-blue-400'
      }`} />
      <p className="text-sm text-neutral-300 flex-1 leading-relaxed">
        <span className="text-white font-semibold">{weekCount} earthquakes</span> in the Bay Area this week
        {largestRecent && (
          <>
            {' — '}the largest was a{' '}
            <span className="font-medium" style={{ color: getMagnitudeColor(largestRecent.magnitude) }}>
              M{largestRecent.magnitude.toFixed(1)}
            </span>
            {' '}near {largestRecent.place?.split(',')[0] || 'Bay Area'}
          </>
        )}
        {feltCount > 0 && (
          <span className="text-neutral-400">
            {' · '}{feltCount} felt by residents
          </span>
        )}
        {'.'}
      </p>
      <button
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem('baytremor-weekly-ctx-dismissed', '1');
        }}
        className="p-1 rounded hover:bg-white/10 transition-colors text-neutral-600 hover:text-neutral-400 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function HeroQuakeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      <div className="md:col-span-3 card p-4 sm:p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-3 h-3 rounded bg-white/5" />
          <div className="h-3 bg-white/5 rounded w-32" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/5 rounded w-24" />
            <div className="h-5 bg-white/10 rounded w-48" />
            <div className="h-3 bg-white/5 rounded w-40" />
          </div>
        </div>
      </div>
      <div className="md:col-span-1 card p-4 sm:p-5">
        <div className="flex md:flex-col items-center md:items-center md:justify-center gap-3 sm:gap-4 md:gap-2 h-full md:py-2">
          <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-white/5" />
          <div className="space-y-2 md:text-center">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-3 bg-white/5 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LiveTabProps {
  realtimeQuakes: Earthquake[];
  isLoading: boolean;
  last24Hours: Earthquake[];
  hotspotRegion: HotspotRegion;
  historicalSummary: HistoricalSummary;
  aiSummary: string | null;
  isLoadingAiSummary: boolean;
  myCity: MyCityData | null;
  myCityStats: MyCityStatsData | null;
  myCityLoaded: boolean;
  selectedEarthquake: Earthquake | null;
  onSelectEarthquake: (eq: Earthquake | null) => void;
  onViewDetail: (eq: Earthquake) => void;
  onSetCity: () => void;
  onShowAllQuakes: () => void;
  largestRecent: Earthquake | null;
  m3PlusCount: number;
  avgDepth: number;
  strongestToday: Earthquake | null;
}

export function LiveTab({
  realtimeQuakes,
  isLoading,
  last24Hours,
  hotspotRegion,
  historicalSummary,
  aiSummary,
  isLoadingAiSummary,
  myCity,
  myCityStats,
  myCityLoaded,
  selectedEarthquake,
  onSelectEarthquake,
  onViewDetail,
  onSetCity,
  onShowAllQuakes,
  largestRecent,
  m3PlusCount,
  avgDepth,
  strongestToday,
}: LiveTabProps) {
  const { unitSystem } = useUnits();
  const [magnitudeFilter, setMagnitudeFilter] = useState<MagnitudeFilter>('all');
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);

  const magnitudeFilteredQuakes = useMemo(() => {
    switch (magnitudeFilter) {
      case 'm2plus':
        return realtimeQuakes.filter(eq => eq.magnitude >= 2.0);
      case 'm3plus':
        return realtimeQuakes.filter(eq => eq.magnitude >= 3.0);
      case 'felt':
        return realtimeQuakes.filter(eq => eq.felt && eq.felt > 0);
      case 'all':
      default:
        return realtimeQuakes;
    }
  }, [realtimeQuakes, magnitudeFilter]);

  const filterCounts = useMemo(() => ({
    all: realtimeQuakes.length,
    m2plus: realtimeQuakes.filter(eq => eq.magnitude >= 2.0).length,
    m3plus: realtimeQuakes.filter(eq => eq.magnitude >= 3.0).length,
    felt: realtimeQuakes.filter(eq => eq.felt && eq.felt > 0).length,
  }), [realtimeQuakes]);

  const handleEarthquakeListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setDisplayedItemsCount(prev => Math.min(prev + 20, magnitudeFilteredQuakes.length));
    }
  }, [magnitudeFilteredQuakes.length]);

  return (
    <>
      <IOSAppBanner />

      {!isLoading && (
        <WeeklyContextBanner
          weekCount={realtimeQuakes.length}
          largestRecent={largestRecent}
          last24HoursCount={last24Hours.length}
          feltCount={realtimeQuakes.filter(eq => eq.felt && eq.felt > 0).length}
        />
      )}

      {hotspotRegion.isElevated && (
        <CollapsibleAlert
          hotspotRegion={hotspotRegion}
          aiSummary={aiSummary}
          isLoadingAiSummary={isLoadingAiSummary}
        />
      )}

      {isLoading ? (
        <HeroQuakeSkeleton />
      ) : (
        <HeroQuake
          earthquakes={realtimeQuakes}
          onViewDetails={onViewDetail}
          myCity={myCity}
          myCityStats={myCityStats}
          myCityLoaded={myCityLoaded}
          onSetCity={onSetCity}
        />
      )}

      {/* Map + Feed Side by Side */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
        <section className="lg:col-span-3 card overflow-hidden">
          <div className="p-2.5 sm:p-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              <span className="text-xs sm:text-sm font-medium">Bay Area • Live</span>
            </div>
            <a 
              href="https://earthquake.usgs.gov/earthquakes/map/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-neutral-500 hover:text-white flex items-center gap-1"
            >
              USGS <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </a>
          </div>
          <LeafletMap 
            earthquakes={realtimeQuakes}
            selectedEarthquake={selectedEarthquake}
            onSelectEarthquake={onSelectEarthquake}
            className="min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]"
            initialRegion={hotspotRegion.isElevated ? hotspotRegion.regionId : undefined}
          />
        </section>

        <section id="earthquake-feed" className="lg:col-span-2 card p-0 flex flex-col max-h-[400px] sm:max-h-[560px]">
          <div className="p-2.5 sm:p-3 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">Recent Quakes</span>
                <span className="text-[10px] sm:text-xs text-neutral-500 flex-shrink-0">{magnitudeFilteredQuakes.length}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {last24Hours.length} in 24h
                </span>
                {magnitudeFilteredQuakes.length > 20 && (
                  <button
                    onClick={onShowAllQuakes}
                    className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {([
                { key: 'all', label: 'All', count: filterCounts.all },
                { key: 'm2plus', label: 'M2+', count: filterCounts.m2plus },
                { key: 'm3plus', label: 'M3+', count: filterCounts.m3plus },
                { key: 'felt', label: 'Felt', count: filterCounts.felt },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => { setMagnitudeFilter(key); setDisplayedItemsCount(20); }}
                  className={`px-2 py-1 text-[10px] sm:text-xs rounded-md transition-all flex items-center gap-1 ${
                    magnitudeFilter === key
                      ? 'bg-white/15 text-white font-medium'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-300'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`tabular-nums ${magnitudeFilter === key ? 'text-white/70' : 'text-neutral-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-y-auto scrollbar-thin"
            onScroll={magnitudeFilter === 'felt' ? handleEarthquakeListScroll : undefined}
          >
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[104px] bg-white/[0.02] border border-white/5 rounded-xl animate-pulse flex p-4 gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-white/5 rounded" />
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : magnitudeFilteredQuakes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm py-8">
                <span>No earthquakes match this filter</span>
                <button 
                  onClick={() => setMagnitudeFilter('all')}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                >
                  Show all earthquakes
                </button>
              </div>
            ) : magnitudeFilter === 'felt' ? (
              <div className="divide-y divide-white/5">
                {deduplicateEarthquakes(magnitudeFilteredQuakes.slice(0, displayedItemsCount)).map((eq, i) => (
                  <CompactEarthquakeRow 
                    key={eq.id} 
                    earthquake={eq} 
                    isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
                    isSelected={selectedEarthquake?.id === eq.id}
                    onClick={() => {
                      onSelectEarthquake(eq);
                      onViewDetail(eq);
                    }}
                    userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
                  />
                ))}
                {displayedItemsCount < magnitudeFilteredQuakes.length && (
                  <div className="flex items-center justify-center py-4 text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Scroll for more ({magnitudeFilteredQuakes.length - displayedItemsCount} remaining)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {deduplicateEarthquakes(magnitudeFilteredQuakes.slice(0, 20)).map((eq, i) => (
                  <CompactEarthquakeRow 
                    key={eq.id} 
                    earthquake={eq} 
                    isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
                    isSelected={selectedEarthquake?.id === eq.id}
                    onClick={() => {
                      onSelectEarthquake(eq);
                      onViewDetail(eq);
                    }}
                    userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
                  />
                ))}
                {magnitudeFilteredQuakes.length > 20 && (
                  <button 
                    onClick={onShowAllQuakes}
                    className="w-full py-3 text-xs text-neutral-500 hover:text-white transition-colors"
                  >
                    View all {magnitudeFilteredQuakes.length} earthquakes →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Felt By Community */}
      {(() => {
        const seventyTwoHoursAgo = Date.now() - (72 * 60 * 60 * 1000);
        const feltQuakes = realtimeQuakes
          .filter(eq => eq.felt && eq.felt > 0 && eq.time.getTime() > seventyTwoHoursAgo)
          .sort((a, b) => (b.felt || 0) - (a.felt || 0));
        
        if (feltQuakes.length === 0) return null;
        
        return (
          <section className="card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">Felt By Community</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {feltQuakes.length} in 72h
                </span>
              </div>
              <button
                onClick={() => setMagnitudeFilter('felt')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all felt
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {feltQuakes.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => {
                    onSelectEarthquake(eq);
                    onViewDetail(eq);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 transition-all group text-left"
                >
                  <div 
                    className="text-lg font-light tabular-nums w-10 text-center flex-shrink-0"
                    style={{ color: getMagnitudeColor(eq.magnitude) }}
                  >
                    {eq.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate font-medium">
                      {getLocationContext(eq.latitude, eq.longitude, unitSystem).formattedLocation || eq.place?.split(',')[0] || 'Bay Area'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-neutral-500">
                        {formatDistanceToNow(eq.time, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                      <Users className="w-2.5 h-2.5" />
                      <span className="font-medium">{eq.felt} felt it</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">This Week</span>
          </div>
          <div className="text-xl sm:text-2xl font-light">{realtimeQuakes.length}</div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">earthquakes</div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Last 24h</span>
          </div>
          <div className="text-xl sm:text-2xl font-light">{last24Hours.length}</div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">recent</div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Largest</span>
          </div>
          <div 
            className="text-xl sm:text-2xl font-light"
            style={{ color: largestRecent ? getMagnitudeColor(largestRecent.magnitude) : undefined }}
          >
            {largestRecent?.magnitude.toFixed(1) || '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">
            {largestRecent ? getMagnitudeLabel(largestRecent.magnitude) : 'No data'}
          </div>
        </div>

        <div className={`card p-3 sm:p-4 ${hotspotRegion.isElevated ? 'ring-1 ring-white/20' : ''}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Hotspot</span>
          </div>
          <div className="text-xl sm:text-2xl font-light" style={{ color: hotspotRegion.region?.color }}>
            {hotspotRegion.count}
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">
            {hotspotRegion.region?.name.split('/')[0].trim() || 'Most active'}
          </div>
        </div>

        <div className={`card p-3 sm:p-4 ${m3PlusCount >= 3 ? 'ring-1 ring-white/20' : ''}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">M3+</span>
          </div>
          <div className="text-xl sm:text-2xl font-light">{m3PlusCount}</div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">significant</div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Depth</span>
          </div>
          <div className="text-xl sm:text-2xl font-light">{formatDepth(avgDepth, unitSystem)}</div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">{getDepthDescription(avgDepth)}</div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Today</span>
          </div>
          <div 
            className="text-xl sm:text-2xl font-light"
            style={{ color: strongestToday ? getMagnitudeColor(strongestToday.magnitude) : undefined }}
          >
            {strongestToday?.magnitude.toFixed(1) || '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate" suppressHydrationWarning>
            {strongestToday ? formatDistanceToNow(strongestToday.time, { addSuffix: true }) : 'None yet'}
          </div>
        </div>
      </div>

      <CommunityWidget />
      <AffiliateShowcase />
    </>
  );
}
