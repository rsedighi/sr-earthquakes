'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import dynamic from 'next/dynamic';
import { 
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  RefreshCw,
  ChevronDown,
  Users,
  Zap,
  Home,
  Map,
  BarChart3,
  Loader2,
  Flame,
  Target,
  Settings,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import { Earthquake, SwarmEvent } from '@/lib/types';
import { REGIONS, getRegionById, getLocationContext } from '@/lib/regions';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { useHistoricalEarthquakes } from '@/hooks/use-historical-earthquakes';
import { useMyCity, SELECTABLE_CITIES } from '@/hooks/use-my-city';
import { detectSwarms, getMagnitudeColor, getMagnitudeLabel, getRecentActivity } from '@/lib/analysis';
import { RegionComparison } from './region-comparison';
import { MyNeighborhood } from './my-neighborhood';
import { HistoricalSwarms } from './historical-swarms';
import { EarthquakeDetailModal } from './earthquake-detail-modal';
import { BayAreaLogo } from './bay-area-logo';

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(
  () => import('./leaflet-map').then(mod => mod.LeafletMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[400px] bg-neutral-900/50 rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }
);

// Lightweight summary from server - NO raw earthquake arrays!
interface HistoricalSummary {
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  magnitudeRange: {
    min: number;
    max: number;
    avg: number;
  };
  byRegion: Record<string, number>;
  biggestQuake: {
    id: string;
    magnitude: number;
    place: string;
    timestamp: number;
    region: string;
  } | null;
  regionStats: Array<{
    regionId: string;
    totalCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
  }>;
  swarmSummaries: Array<{
    id: string;
    startTime: string;
    endTime: string;
    peakMagnitude: number;
    totalCount: number;
    region: string;
  }>;
  sanRamonCount: number;
  santaClaraCount: number;
  sanRamonSwarmCount: number;
  santaClaraSwarmCount: number;
  avgWeeklyRate: number;
}

interface DashboardProps {
  historicalSummary: HistoricalSummary;
}

// Helper to deduplicate earthquakes by ID
function deduplicateEarthquakes(earthquakes: Earthquake[]): Earthquake[] {
  const seen = new Set<string>();
  const result: Earthquake[] = [];
  for (const eq of earthquakes) {
    if (!seen.has(eq.id)) {
      seen.add(eq.id);
      result.push(eq);
    }
  }
  return result;
}

export function Dashboard({ historicalSummary }: DashboardProps) {
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [detailEarthquake, setDetailEarthquake] = useState<Earthquake | null>(null);
  const [showAllQuakes, setShowAllQuakes] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'neighborhood' | 'compare' | 'history' | 'learn'>('live');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState(false);
  
  // Lock body scroll when city selector modal is open
  useEffect(() => {
    if (showCitySelector) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showCitySelector]);
  
  // Historical earthquakes loaded on-demand (lazy loading)
  const [historicalQuakes, setHistoricalQuakes] = useState<Earthquake[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalLoaded, setHistoricalLoaded] = useState(false); // Track if we've loaded ALL data

  // Real-time data (this week)
  const { 
    earthquakes: realtimeQuakes, 
    isLoading, 
    lastUpdated, 
    refresh,
    isRefreshing 
  } = useRealtimeEarthquakes({
    feed: 'all_week',
    refreshInterval: 60000,
  });

  // Recent earthquake data (since Dec 8, 2025) - supplements the historical data
  const {
    earthquakes: recentQuakes,
    isLoading: isLoadingRecent,
  } = useHistoricalEarthquakes({
    minMagnitude: 0.1,
    autoFetch: true,
  });
  
  // User's selected city for personalized widget
  const { myCity, setCityByName, stats: myCityStats, isLoaded: myCityLoaded, availableCities } = useMyCity(realtimeQuakes);
  
  // Load ALL historical earthquakes when needed (for neighborhood/compare/history tabs)
  const loadHistoricalQuakes = useCallback(async () => {
    if (historicalLoading || historicalLoaded) return;
    setHistoricalLoading(true);
    
    try {
      // Fetch ALL historical data at once for swarm detection
      const res = await fetch(`/api/earthquakes/list?all=true`);
      if (res.ok) {
        const data = await res.json();
        const quakes = data.earthquakes.map((eq: { id: string; magnitude: number; place: string; time: string; timestamp: number; latitude: number; longitude: number; depth: number; felt: number | null; significance: number; url: string; region: string; }) => ({
          ...eq,
          time: new Date(eq.time),
        }));
        
        setHistoricalQuakes(quakes);
        setHistoricalLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load historical earthquakes:', error);
    } finally {
      setHistoricalLoading(false);
    }
  }, [historicalLoading, historicalLoaded]);
  
  // Load historical data when switching to tabs that need it
  useEffect(() => {
    if ((activeTab === 'neighborhood' || activeTab === 'compare' || activeTab === 'history') && !historicalLoaded) {
      loadHistoricalQuakes();
    }
  }, [activeTab, historicalLoaded, loadHistoricalQuakes]);
  
  // Merge recent API data with lazy-loaded historical data
  const allHistoricalQuakes = useMemo(() => {
    const seenIds = new Set<string>();
    const merged: Earthquake[] = [];
    
    // Add recent quakes first (they're more up to date)
    for (const eq of recentQuakes) {
      if (!seenIds.has(eq.id)) {
        seenIds.add(eq.id);
        merged.push(eq);
      }
    }
    
    // Add historical data loaded on-demand
    for (const eq of historicalQuakes) {
      if (!seenIds.has(eq.id)) {
        seenIds.add(eq.id);
        merged.push(eq);
      }
    }
    
    // Sort by time descending
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentQuakes, historicalQuakes]);

  // Current swarm detection
  const currentSwarm = useMemo(() => {
    const sanRamonRecent = realtimeQuakes.filter(eq => eq.region === 'san-ramon');
    if (sanRamonRecent.length >= 5) {
      const swarms = detectSwarms(sanRamonRecent);
      return swarms[0] || null;
    }
    return null;
  }, [realtimeQuakes]);

  // Calculate key metrics
  const sanRamonCount = realtimeQuakes.filter(eq => eq.region === 'san-ramon').length;
  const significantCount = realtimeQuakes.filter(eq => eq.magnitude >= 2.5).length;
  const feltCount = realtimeQuakes.filter(eq => eq.felt && eq.felt > 0).length;
  const largestRecent = realtimeQuakes.length > 0 
    ? realtimeQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max)
    : null;

  // Historical comparison - use pre-computed summary data
  const avgWeeklyRate = historicalSummary.avgWeeklyRate;
  const isElevated = sanRamonCount > avgWeeklyRate * 2;
  
  // Additional metrics for new widgets
  const m3PlusCount = realtimeQuakes.filter(eq => eq.magnitude >= 3).length;
  const avgDepth = realtimeQuakes.length > 0 
    ? realtimeQuakes.reduce((sum, eq) => sum + eq.depth, 0) / realtimeQuakes.length 
    : 0;
  const strongestToday = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const todayQuakes = realtimeQuakes.filter(eq => eq.timestamp > oneDayAgo);
    return todayQuakes.length > 0 
      ? todayQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max)
      : null;
  }, [realtimeQuakes]);
  
  // Find the most active region (hotspot)
  const hotspotRegion = useMemo(() => {
    const regionCounts: Record<string, number> = {};
    for (const eq of realtimeQuakes) {
      regionCounts[eq.region] = (regionCounts[eq.region] || 0) + 1;
    }
    
    let maxRegion = 'san-ramon';
    let maxCount = 0;
    for (const [regionId, count] of Object.entries(regionCounts)) {
      if (count > maxCount && regionId !== 'unknown') {
        maxCount = count;
        maxRegion = regionId;
      }
    }
    
    const region = getRegionById(maxRegion);
    const avgForRegion = Math.round(
      (historicalSummary.regionStats.find(r => r.regionId === maxRegion)?.totalCount || 0) / (15 * 52)
    );
    const multiplier = avgForRegion > 0 ? maxCount / avgForRegion : 1;
    
    return {
      regionId: maxRegion,
      region,
      count: maxCount,
      isElevated: multiplier > 2,
      multiplier,
    };
  }, [realtimeQuakes, historicalSummary.regionStats]);
  
  // Calculate trend (comparing first half of week to second half)
  const activityTrend = useMemo(() => {
    const midWeek = Date.now() - 3.5 * 24 * 60 * 60 * 1000;
    const firstHalf = realtimeQuakes.filter(eq => eq.timestamp < midWeek).length;
    const secondHalf = realtimeQuakes.filter(eq => eq.timestamp >= midWeek).length;
    
    if (firstHalf === 0) return 'stable';
    const change = (secondHalf - firstHalf) / firstHalf;
    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }, [realtimeQuakes]);

  // Find similar historical swarms - use summary data
  const similarSwarms = useMemo(() => {
    if (!currentSwarm) return [];
    return historicalSummary.swarmSummaries
      .filter(s => s.region === 'san-ramon' && s.peakMagnitude >= currentSwarm.peakMagnitude - 0.5)
      .slice(0, 3);
  }, [currentSwarm, historicalSummary.swarmSummaries]);

  // Get 24-hour activity
  const last24Hours = useMemo(() => {
    const now = Date.now();
    return realtimeQuakes.filter(eq => now - eq.timestamp < 24 * 60 * 60 * 1000);
  }, [realtimeQuakes]);
  
  // Fetch AI summary when elevated activity is detected
  useEffect(() => {
    if (!hotspotRegion.isElevated || aiSummary || isLoadingAiSummary) return;
    
    const fetchAiSummary = async () => {
      setIsLoadingAiSummary(true);
      try {
        const res = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            regionId: hotspotRegion.regionId,
            currentCount: hotspotRegion.count,
            averageCount: Math.round(hotspotRegion.count / hotspotRegion.multiplier),
            multiplier: hotspotRegion.multiplier,
            largestMagnitude: largestRecent?.magnitude || 0,
            recentQuakes: realtimeQuakes.filter(eq => eq.region === hotspotRegion.regionId).slice(0, 10),
            isSwarm: currentSwarm !== null,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setAiSummary(data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch AI summary:', error);
      } finally {
        setIsLoadingAiSummary(false);
      }
    };
    
    fetchAiSummary();
  }, [hotspotRegion.isElevated, hotspotRegion.regionId, hotspotRegion.count, hotspotRegion.multiplier, largestRecent?.magnitude, realtimeQuakes, currentSwarm, aiSummary, isLoadingAiSummary]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <BayAreaLogo variant="seismic-bridge" className="w-11 h-11" />
                {hotspotRegion.isElevated && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-lg">Bay Area Quake Tracker</h1>
                <p className="text-xs text-neutral-500">Live earthquake monitoring for the SF Bay Area</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="hidden sm:block text-sm text-neutral-500">
                  Updated {format(lastUpdated, 'h:mm a')}
                </span>
              )}
              <button 
                onClick={refresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-gentle" />
                <span className="text-white text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs - More Prominent */}
        <div className="bg-neutral-900/50 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
              {[
                { id: 'live', label: 'Live Map', icon: Map, badge: realtimeQuakes.length },
                { id: 'neighborhood', label: 'My Neighborhood', icon: Home },
                { id: 'compare', label: 'Compare Regions', icon: BarChart3 },
                { id: 'history', label: 'History', icon: TrendingUp },
                { id: 'learn', label: 'Learn', icon: Info },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-lg whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'bg-white text-black shadow-lg' 
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && activeTab !== tab.id && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-white/10 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Alert Banner - Show if elevated activity in any region */}
        {hotspotRegion.isElevated && (
          <div className={`rounded-xl p-4 flex items-start gap-4 animate-slide-up border ${
            hotspotRegion.multiplier >= 5 
              ? 'border-red-500/40 bg-red-500/10' 
              : hotspotRegion.multiplier >= 3 
                ? 'border-orange-500/40 bg-orange-500/10' 
                : 'border-yellow-500/40 bg-yellow-500/10'
          }`}>
            <div className={`p-2 rounded-lg ${
              hotspotRegion.multiplier >= 5 
                ? 'bg-red-500/20' 
                : hotspotRegion.multiplier >= 3 
                  ? 'bg-orange-500/20' 
                  : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                hotspotRegion.multiplier >= 5 
                  ? 'text-red-400' 
                  : hotspotRegion.multiplier >= 3 
                    ? 'text-orange-400' 
                    : 'text-yellow-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                hotspotRegion.multiplier >= 5 
                  ? 'text-red-300' 
                  : hotspotRegion.multiplier >= 3 
                    ? 'text-orange-300' 
                    : 'text-yellow-300'
              }`}>
                Elevated Seismic Activity
              </h3>
              <p className="text-sm text-neutral-300 mt-1">
                {aiSummary || (
                  <>
                    {hotspotRegion.region?.name || 'The Bay Area'} is experiencing {hotspotRegion.multiplier.toFixed(1)}× the typical weekly earthquake rate
                    with {hotspotRegion.count} earthquakes this week.
                    {hotspotRegion.region?.faultLine && ` Activity is centered along the ${hotspotRegion.region.faultLine}.`}
                  </>
                )}
              </p>
            </div>
            <a 
              href="https://earthquake.usgs.gov/earthquakes/eventpage/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white text-sm flex items-center gap-1 flex-shrink-0"
            >
              USGS <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {activeTab === 'live' && (
          <>
            {/* Key Stats - Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="This Week"
                value={realtimeQuakes.length}
                subtext="earthquakes in Bay Area"
                icon={<Activity className="w-4 h-4" />}
                trend={activityTrend}
              />
              <StatCard
                label="In Last 24h"
                value={last24Hours.length}
                subtext="recent activity"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatCard
                label="Largest"
                value={largestRecent?.magnitude.toFixed(1) || '—'}
                subtext={largestRecent ? getMagnitudeLabel(largestRecent.magnitude) : 'No data'}
                icon={<Zap className="w-4 h-4" />}
                highlight={Boolean(largestRecent && largestRecent.magnitude >= 3)}
              />
              <StatCard
                label="Hotspot"
                value={hotspotRegion.count}
                subtext={hotspotRegion.region?.name.split('/')[0].trim() || 'Most active'}
                icon={<Flame className="w-4 h-4" />}
                highlight={hotspotRegion.isElevated}
                regionColor={hotspotRegion.region?.color}
              />
            </div>
            
            {/* Key Stats - Row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="M3+ Events"
                value={m3PlusCount}
                subtext="significant quakes"
                icon={<Target className="w-4 h-4" />}
                highlight={m3PlusCount >= 3}
              />
              <StatCard
                label="Avg Depth"
                value={`${avgDepth.toFixed(1)}km`}
                subtext={avgDepth < 10 ? 'Shallow' : avgDepth < 30 ? 'Intermediate' : 'Deep'}
                icon={<Layers className="w-4 h-4" />}
              />
              <StatCard
                label="Strongest Today"
                value={strongestToday?.magnitude.toFixed(1) || '—'}
                subtext={strongestToday ? formatDistanceToNow(strongestToday.time, { addSuffix: true }) : 'None yet'}
                icon={<Sparkles className="w-4 h-4" />}
              />
              {/* Configurable My City Widget */}
              <div className="relative">
                {myCityLoaded && myCity ? (
                  <StatCard
                    label={myCity.cityName}
                    value={myCityStats?.nearbyThisWeek || 0}
                    subtext={myCityStats?.isElevated ? 'Elevated activity' : 'quakes nearby'}
                    icon={<Home className="w-4 h-4" />}
                    highlight={myCityStats?.isElevated}
                    onConfigure={() => setShowCitySelector(true)}
                  />
                ) : (
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="card p-4 w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-white/[0.04] transition-colors border-dashed border-white/20"
                  >
                    <Settings className="w-5 h-5 text-neutral-500" />
                    <span className="text-sm text-neutral-400">Set Your City</span>
                    <span className="text-xs text-neutral-600">Personalized stats</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* City Selector Modal */}
            {showCitySelector && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in overscroll-contain">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col mx-4">
                  <h3 className="text-lg font-semibold mb-2">Select Your City</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Choose a city to see personalized earthquake stats within 10 miles of your area.
                  </p>
                  
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search cities..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/30"
                      autoFocus
                    />
                    {citySearch && (
                      <button
                        onClick={() => setCitySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto flex-1 space-y-1">
                    {availableCities
                      .filter(city => 
                        city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                        city.county.toLowerCase().includes(citySearch.toLowerCase())
                      )
                      .map(city => (
                        <button
                          key={city.name}
                          onClick={() => {
                            setCityByName(city.name);
                            setShowCitySelector(false);
                            setCitySearch('');
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left
                            ${myCity?.cityName === city.name 
                              ? 'bg-white/10 border border-white/20' 
                              : 'hover:bg-white/5'}`}
                        >
                          <div>
                            <div className="font-medium">{city.name}</div>
                            <div className="text-xs text-neutral-500">{city.county} County</div>
                          </div>
                          {myCity?.cityName === city.name && (
                            <span className="text-white text-sm">Selected</span>
                          )}
                        </button>
                      ))}
                    {availableCities.filter(city => 
                      city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      city.county.toLowerCase().includes(citySearch.toLowerCase())
                    ).length === 0 && (
                      <p className="text-center text-neutral-500 py-8">No cities found matching "{citySearch}"</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setShowCitySelector(false);
                        setCitySearch('');
                      }}
                      className="flex-1 px-4 py-2 bg-white/5 text-neutral-400 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    {myCity && (
                      <button
                        onClick={() => {
                          setCityByName('');
                          setShowCitySelector(false);
                          setCitySearch('');
                        }}
                        className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Map Section */}
            <section className="card overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Live Earthquake Map</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">San Francisco Bay Area • Last 7 days</p>
                  </div>
                  <a 
                    href="https://earthquake.usgs.gov/earthquakes/map/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    Full USGS Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <LeafletMap 
                earthquakes={realtimeQuakes}
                selectedEarthquake={selectedEarthquake}
                onSelectEarthquake={setSelectedEarthquake}
                className="min-h-[450px]"
              />
            </section>

            {/* Recent Activity Feed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Earthquakes</h2>
                <span className="text-sm text-neutral-500">
                  {last24Hours.length} in last 24 hours
                </span>
              </div>
              
              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 skeleton rounded-xl" />
                  ))
                ) : realtimeQuakes.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    No earthquakes recorded this week
                  </div>
                ) : (
                  <>
                    {deduplicateEarthquakes(showAllQuakes ? realtimeQuakes : realtimeQuakes.slice(0, 10)).map((eq, i) => (
                      <EarthquakeRow 
                        key={`${eq.id}-${i}`} 
                        earthquake={eq} 
                        isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
                        isSelected={selectedEarthquake?.id === eq.id}
                        onClick={() => setDetailEarthquake(eq)}
                        onMapSelect={() => setSelectedEarthquake(selectedEarthquake?.id === eq.id ? null : eq)}
                      />
                    ))}
                    {realtimeQuakes.length > 10 && !showAllQuakes && (
                      <button 
                        onClick={() => setShowAllQuakes(true)}
                        className="w-full py-3 text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Show {realtimeQuakes.length - 10} more
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'neighborhood' && (
          <MyNeighborhood 
            historicalEarthquakes={allHistoricalQuakes}
          />
        )}

        {activeTab === 'compare' && (
          <RegionComparison 
            earthquakes={allHistoricalQuakes}
          />
        )}

        {activeTab === 'history' && (
          <>
            {/* Historical Swarms by Region - New Feature */}
            {historicalLoading && !historicalLoaded ? (
              <div className="card p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-500">Loading 15 years of earthquake data...</p>
                <p className="text-xs text-neutral-600 mt-2">This may take a moment</p>
              </div>
            ) : (
              <HistoricalSwarms 
                earthquakes={allHistoricalQuakes}
              />
            )}
            
            {/* Historical Context - uses summary data (no loading needed) */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4">15 Years of Data</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Total Earthquakes</span>
                    <span className="text-2xl font-light">{historicalSummary.totalCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Swarm Events Detected</span>
                    <span className="text-2xl font-light">{historicalSummary.swarmSummaries.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Largest Recorded</span>
                    <span className="text-2xl font-light">M{historicalSummary.biggestQuake?.magnitude.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-neutral-400">Data Range</span>
                    <span className="text-sm text-neutral-300">2010 – Present</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold mb-4">Regional Comparison</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  How does earthquake activity compare across Northern California regions?
                </p>
                <div className="space-y-4">
                  {historicalSummary.regionStats
                    .filter(r => r.totalCount > 0)
                    .sort((a, b) => b.totalCount - a.totalCount)
                    .slice(0, 4)
                    .map(stat => {
                      const region = getRegionById(stat.regionId);
                      const maxCount = Math.max(...historicalSummary.regionStats.map(r => r.totalCount));
                      return (
                        <div key={stat.regionId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-300">{region?.name || stat.regionId}</span>
                            <span className="text-neutral-500">{stat.totalCount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(stat.totalCount / maxCount) * 100}%`,
                                backgroundColor: region?.color || '#6b7280'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'learn' && (
          <LearnSection />
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/5 mt-12">
          <p className="text-sm text-neutral-500">
            Data from{' '}
            <a href="https://earthquake.usgs.gov/" className="text-neutral-400 hover:text-white transition-colors">
              USGS Earthquake Hazards Program
            </a>
          </p>
          <p className="text-xs text-neutral-600 mt-2">
            This site provides real-time earthquake information for educational purposes.
            For emergencies, dial 911.
          </p>
        </footer>
      </main>
      
      {/* Earthquake Detail Modal */}
      {detailEarthquake && (
        <EarthquakeDetailModal
          earthquake={detailEarthquake}
          onClose={() => setDetailEarthquake(null)}
          breadcrumb="Recent Earthquakes"
          allEarthquakes={allHistoricalQuakes}
        />
      )}
    </div>
  );
}

// Sub-components
function StatCard({ 
  label, 
  value, 
  subtext, 
  icon,
  highlight = false,
  trend,
  regionColor,
  onConfigure,
}: { 
  label: string; 
  value: string | number; 
  subtext: string;
  icon: React.ReactNode;
  highlight?: boolean;
  trend?: 'increasing' | 'decreasing' | 'stable';
  regionColor?: string;
  onConfigure?: () => void;
}) {
  return (
    <div className={`card p-4 relative group ${highlight ? 'border-white/20 bg-white/[0.04]' : ''}`}>
      {onConfigure && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          aria-label="Configure"
        >
          <Settings className="w-3 h-3 text-neutral-500" />
        </button>
      )}
      <div className="flex items-center gap-2 text-neutral-500 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider truncate">{label}</span>
        {trend && trend !== 'stable' && (
          <span className={`flex items-center ${trend === 'increasing' ? 'text-neutral-300' : 'text-neutral-400'}`}>
            {trend === 'increasing' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      <div className={`text-3xl font-light ${highlight ? 'text-white' : ''}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500 mt-1 truncate">{subtext}</div>
    </div>
  );
}

// Comprehensive Educational Section
function LearnSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };
  
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold mb-3">Earthquake Education Center</h2>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Understanding earthquakes is the first step to being prepared. 
          Learn the science, know the risks, and be ready for the Bay Area's seismic reality.
        </p>
      </div>
      
      {/* For Kids Section */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            For Kids: What is an Earthquake?
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                The Earth isn't one solid piece — it's more like a cracked eggshell! 
                The outer layer is made up of giant pieces called <strong>tectonic plates</strong> that 
                fit together like a puzzle. These plates are always moving, very slowly.
              </p>
              <p className="text-neutral-300 leading-relaxed">
                When two plates push against each other, they can get stuck. Pressure builds up, 
                like when you push two magnets together. Eventually, the plates slip past each other suddenly — 
                and that's an earthquake!
              </p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
              <h4 className="font-semibold mb-4 text-neutral-200">Fun Facts</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Earth has about 500,000 detectable earthquakes every year. Only 100,000 can be felt.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Some animals can sense earthquakes before humans feel them.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-neutral-400">The largest earthquake ever recorded was a 9.5 in Chile in 1960.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Earthquakes happen under the ocean too — they can cause tsunamis!</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Drop Cover Hold On */}
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/10">
            <h4 className="font-semibold mb-4 text-lg">The 3 Steps: Drop, Cover, Hold On</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-400">1</span>
                </div>
                <h5 className="font-semibold text-neutral-200 mb-2">DROP</h5>
                <p className="text-sm text-neutral-400">
                  Get down on your hands and knees. This position protects you from falling and lets you crawl to shelter.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-400">2</span>
                </div>
                <h5 className="font-semibold text-neutral-200 mb-2">COVER</h5>
                <p className="text-sm text-neutral-400">
                  Get under a sturdy desk or table. Cover your head and neck with your arms if no shelter is nearby.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-yellow-400">3</span>
                </div>
                <h5 className="font-semibold text-neutral-200 mb-2">HOLD ON</h5>
                <p className="text-sm text-neutral-400">
                  Stay under cover and hold on until the shaking stops. Be prepared to move with your shelter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Understanding Magnitude */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Understanding Magnitude
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400">
            The Richter magnitude scale is <strong>logarithmic</strong> — each whole number increase represents 
            10× more ground motion and about 31× more energy released. A magnitude 5.0 earthquake releases 
            31 times more energy than a 4.0, and nearly 1,000 times more than a 3.0.
          </p>
          
          <div className="space-y-3">
            {[
              { mag: 2, label: 'Micro', desc: 'Rarely felt by people. Recorded only by seismometers. About 1,300 happen daily worldwide.', energy: '63 kg TNT' },
              { mag: 3, label: 'Minor', desc: 'Often felt, but rarely causes damage. Similar to a large truck passing nearby.', energy: '2 tons TNT' },
              { mag: 4, label: 'Light', desc: 'Noticeable shaking indoors. Windows rattle, objects on shelves may fall.', energy: '63 tons TNT' },
              { mag: 5, label: 'Moderate', desc: 'Can cause damage to weak buildings. Felt widely over large areas.', energy: '2,000 tons TNT' },
              { mag: 6, label: 'Strong', desc: 'Destructive in areas up to 100 miles. Can topple poorly constructed buildings.', energy: '63,000 tons TNT' },
              { mag: 7, label: 'Major', desc: 'Causes serious damage over large areas. The 1989 Loma Prieta earthquake was 6.9.', energy: '2 million tons TNT' },
              { mag: 8, label: 'Great', desc: 'Can cause serious damage in areas several hundred miles across.', energy: '63 million tons TNT' },
            ].map(item => (
              <div key={item.mag} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: getMagnitudeColor(item.mag) + '20',
                    color: getMagnitudeColor(item.mag)
                  }}
                >
                  {item.mag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">{item.label}</span>
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-neutral-500">{item.energy}</span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bay Area Fault Lines */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Map className="w-4 h-4 text-white" />
            </div>
            Bay Area Fault Lines
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400 mb-6">
            The San Francisco Bay Area sits on one of the most seismically active regions in the United States. 
            Several major fault systems run through our region, each capable of producing significant earthquakes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { 
                name: 'San Andreas Fault', 
                desc: 'The most famous fault in California. Runs 800 miles from the Salton Sea to Cape Mendocino.',
                risk: 'High',
                lastMajor: '1906 (M7.9)',
                yearsSince: new Date().getFullYear() - 1906
              },
              { 
                name: 'Hayward Fault', 
                desc: 'Runs through the East Bay, directly beneath densely populated cities.',
                risk: 'Very High',
                lastMajor: '1868 (M6.8)',
                yearsSince: new Date().getFullYear() - 1868
              },
              { 
                name: 'Calaveras Fault', 
                desc: 'Eastern fault zone running through San Ramon, Dublin, and into Silicon Valley.',
                risk: 'Moderate',
                lastMajor: '1984 (M6.2)',
                yearsSince: new Date().getFullYear() - 1984
              },
              { 
                name: 'Rodgers Creek Fault', 
                desc: 'Northern extension of the Hayward Fault, through Sonoma and Napa.',
                risk: 'High',
                lastMajor: '1969 (M5.7)',
                yearsSince: new Date().getFullYear() - 1969
              },
            ].map(fault => (
              <div key={fault.name} className="p-5 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-neutral-200">{fault.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    fault.risk === 'Very High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    fault.risk === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {fault.risk} Risk
                  </span>
                </div>
                <p className="text-sm text-neutral-400 mb-3">{fault.desc}</p>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>Last major: {fault.lastMajor}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    fault.yearsSince >= 100 ? 'text-red-400' : 
                    fault.yearsSince >= 50 ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                    {fault.yearsSince} years
                  </span>
                  <span className="text-xs text-neutral-500">since last M6.0+ earthquake</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Earthquake Swarms */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            What is an Earthquake Swarm?
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                An earthquake swarm is a series of many small earthquakes occurring in a localized area 
                over days to weeks, without a clear mainshock-aftershock pattern. Unlike typical earthquake 
                sequences where one large quake triggers smaller aftershocks, swarms involve numerous 
                similar-sized events.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                The San Ramon/Dublin area frequently experiences earthquake swarms along the Calaveras Fault. 
                These swarms are caused by fluids moving through fault zones, reducing friction and allowing 
                small slips to occur.
              </p>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h5 className="font-medium text-neutral-200 mb-2">Are swarms dangerous?</h5>
                <p className="text-sm text-neutral-400">
                  Most swarms consist of small earthquakes (M2-3) and pose no direct danger. Scientists monitor 
                  them because in rare cases, they can precede larger earthquakes. However, the vast majority 
                  of Bay Area swarms end without producing damaging events.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="text-2xl font-light text-white">5-50+</div>
                  <div className="text-xs text-neutral-500 mt-1">Typical events</div>
                </div>
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="text-2xl font-light text-white">1-72h</div>
                  <div className="text-xs text-neutral-500 mt-1">Duration</div>
                </div>
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="text-2xl font-light text-white">&lt;10km</div>
                  <div className="text-xs text-neutral-500 mt-1">Cluster radius</div>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h5 className="font-medium text-neutral-200 mb-3">How scientists detect swarms</h5>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">1.</span>
                    Multiple small earthquakes within a tight geographic area
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">2.</span>
                    No clear "mainshock" — events are similar in size
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">3.</span>
                    Activity elevated above normal background rate
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">4.</span>
                    Usually concentrated within 72 hours
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Emergency Preparedness */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            Emergency Preparedness
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400">
            The Bay Area will experience a major earthquake. The question isn't if, but when. 
            Being prepared can save your life and make recovery much easier.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Emergency Kit */}
            <div>
              <h4 className="font-semibold text-neutral-200 mb-4">Essential Emergency Kit</h4>
              <div className="space-y-2">
                {[
                  'Water (1 gallon per person per day for 3+ days)',
                  'Non-perishable food (3+ day supply)',
                  'First aid kit',
                  'Flashlight and extra batteries',
                  'Battery-powered or hand-crank radio',
                  'Wrench or pliers (to turn off utilities)',
                  'Manual can opener',
                  'Important documents in waterproof container',
                  'Cell phone chargers and backup battery',
                  'Cash in small bills',
                  'Medications and medical supplies',
                  'Sanitation and personal hygiene items',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-neutral-400 py-2 border-b border-white/5 last:border-0">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-400">
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              
              {/* Affiliate Links Placeholder */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Recommended Products</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  Get prepared with quality emergency supplies from our trusted partners.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Emergency Go Bags</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Water Storage Solutions</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Emergency Food Kits</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* What to Do */}
            <div>
              <h4 className="font-semibold text-neutral-200 mb-4">During an Earthquake</h4>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're indoors:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Drop, Cover, and Hold On</li>
                    <li>• Stay away from windows and heavy objects</li>
                    <li>• Stay inside until shaking stops</li>
                    <li>• DO NOT run outside or to doorways</li>
                  </ul>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're outdoors:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Move to a clear area away from buildings</li>
                    <li>• Avoid power lines and trees</li>
                    <li>• Drop to the ground if you can't move</li>
                  </ul>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're driving:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Pull over safely to the side</li>
                    <li>• Avoid bridges, overpasses, and power lines</li>
                    <li>• Stay in your car until shaking stops</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ShakeAlert */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            ShakeAlert: Early Warning System
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                ShakeAlert is the earthquake early warning system for the West Coast. It can give you 
                seconds to tens of seconds of warning before shaking reaches your location.
              </p>
              <p className="text-neutral-400">
                While it can't predict earthquakes, it detects them as they begin and sends alerts 
                faster than seismic waves travel. Those few seconds can be crucial for taking cover 
                or stopping machinery.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.shakealert.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                >
                  Learn about ShakeAlert
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://www.myshake.berkeley.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors font-medium border border-white/10"
                >
                  Download MyShake App
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="p-5 bg-white/[0.02] rounded-xl border border-white/5">
              <h5 className="font-medium text-neutral-200 mb-4">How much warning will I get?</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">10 miles from epicenter</span>
                  <span className="text-white font-mono">~3 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">30 miles from epicenter</span>
                  <span className="text-white font-mono">~10 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">50 miles from epicenter</span>
                  <span className="text-white font-mono">~20 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">100 miles from epicenter</span>
                  <span className="text-white font-mono">~40 seconds</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                Warning time depends on your distance from the earthquake epicenter and how quickly 
                the system can process and deliver the alert.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Resources */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
            Official Resources
          </h3>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'USGS Earthquake Hazards', url: 'https://earthquake.usgs.gov/', desc: 'Official earthquake monitoring and data' },
              { title: 'UC Berkeley Seismology Lab', url: 'https://seismo.berkeley.edu/', desc: 'Research and monitoring for Northern California' },
              { title: 'Ready.gov Earthquakes', url: 'https://www.ready.gov/earthquakes', desc: 'Federal emergency preparedness guide' },
              { title: 'ShakeAlert', url: 'https://www.shakealert.org/', desc: 'Early warning system for the West Coast' },
              { title: 'California Geological Survey', url: 'https://www.conservation.ca.gov/cgs', desc: 'State geological hazard information' },
              { title: 'SF72.org', url: 'https://sf72.org/', desc: 'San Francisco emergency preparedness' },
            ].map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-200 group-hover:text-white transition-colors">{link.title}</span>
                  <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-neutral-500">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

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
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left cursor-pointer group
        ${isNew ? 'bg-white/[0.06] border border-white/10' : 'hover:bg-white/[0.03]'}
        ${isSelected ? 'ring-2 ring-white/30 bg-white/[0.03]' : ''}`}
      onClick={onClick}
    >
      {/* Magnitude */}
      <div className="w-14 text-center flex-shrink-0">
        <div 
          className={`text-2xl font-light`}
          style={{ color: getMagnitudeColor(earthquake.magnitude) }}
        >
          {earthquake.magnitude.toFixed(1)}
        </div>
        <div className="text-[10px] text-neutral-500 uppercase">
          {getMagnitudeLabel(earthquake.magnitude)}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Primary location - nearest city with distance */}
        <div className="text-sm font-medium">
          {locationContext.formattedLocation || earthquake.place}
        </div>
        {/* Original USGS place name if different */}
        {locationContext.formattedLocation && (
          <div className="text-xs text-neutral-500 truncate mt-0.5">
            {earthquake.place}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(earthquake.time, { addSuffix: true })}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{earthquake.depth.toFixed(0)} km deep</span>
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

      {/* Region indicator with area code */}
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

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0 transition-colors" />
    </div>
  );
}
