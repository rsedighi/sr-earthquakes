'use client';

import { useState, useMemo } from 'react';
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
  Loader2
} from 'lucide-react';

import { Earthquake, SwarmEvent } from '@/lib/types';
import { REGIONS, getRegionById, getLocationContext } from '@/lib/regions';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { useHistoricalEarthquakes } from '@/hooks/use-historical-earthquakes';
import { detectSwarms, getMagnitudeColor, getMagnitudeLabel, getRecentActivity } from '@/lib/analysis';
import { RegionComparison } from './region-comparison';
import { MyNeighborhood } from './my-neighborhood';
import { HistoricalSwarms } from './historical-swarms';
import { EarthquakeDetailModal } from './earthquake-detail-modal';

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

interface HistoricalData {
  earthquakes: Earthquake[];
  summary: {
    totalCount: number;
    dateRange: { start: Date; end: Date };
    magnitudeRange: { min: number; max: number; avg: number };
    byRegion: Record<string, number>;
  };
  swarms: SwarmEvent[];
  biggestQuake: Earthquake | null;
  regionStats: {
    regionId: string;
    totalCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
  }[];
  sanRamonQuakes: Earthquake[];
  sanRamonSwarms: SwarmEvent[];
  santaClaraQuakes: Earthquake[];
  santaClaraSwarms: SwarmEvent[];
}

interface DashboardProps {
  historicalData: HistoricalData;
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

export function Dashboard({ historicalData }: DashboardProps) {
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [detailEarthquake, setDetailEarthquake] = useState<Earthquake | null>(null);
  const [showAllQuakes, setShowAllQuakes] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'neighborhood' | 'compare' | 'history' | 'learn'>('live');

  // Real-time data
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

  // Recent earthquake data (since Dec 8, 2025) - supplements the historical data from props
  const {
    earthquakes: recentQuakes,
    isLoading: isLoadingRecent,
  } = useHistoricalEarthquakes({
    minMagnitude: 0.1,
    autoFetch: true,
  });
  
  // Merge historical data (from static files) with recent API data
  // Historical data from props + any new data since Dec 8, 2025
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
    
    // Add historical data from props
    for (const eq of historicalData.earthquakes) {
      if (!seenIds.has(eq.id)) {
        seenIds.add(eq.id);
        merged.push(eq);
      }
    }
    
    // Sort by time descending
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentQuakes, historicalData.earthquakes]);

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

  // Historical comparison
  const avgWeeklyRate = Math.round(historicalData.sanRamonQuakes.length / (15 * 52));
  const isElevated = sanRamonCount > avgWeeklyRate * 2;

  // Find similar historical swarms
  const similarSwarms = useMemo(() => {
    if (!currentSwarm) return [];
    return historicalData.sanRamonSwarms
      .filter(s => s.peakMagnitude >= currentSwarm.peakMagnitude - 0.5)
      .slice(0, 3);
  }, [currentSwarm, historicalData.sanRamonSwarms]);

  // Get 24-hour activity
  const last24Hours = useMemo(() => {
    const now = Date.now();
    return realtimeQuakes.filter(eq => now - eq.timestamp < 24 * 60 * 60 * 1000);
  }, [realtimeQuakes]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                {isElevated && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-lg">Bay Area Earthquake Tracker</h1>
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-gentle" />
                <span className="text-emerald-400 text-sm font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-4 -mb-4 border-b border-white/5 overflow-x-auto">
            {[
              { id: 'live', label: 'Live Map', icon: Map },
              { id: 'neighborhood', label: 'My Neighborhood', icon: Home },
              { id: 'compare', label: 'Compare Regions', icon: BarChart3 },
              { id: 'history', label: 'History', icon: TrendingUp },
              { id: 'learn', label: 'Learn', icon: Info },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap
                  ${activeTab === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Alert Banner - Show if elevated activity */}
        {isElevated && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4 animate-slide-up">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-100">Elevated Seismic Activity</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                San Ramon area is experiencing {Math.round(sanRamonCount / avgWeeklyRate)}× the typical weekly earthquake rate.
                This is characteristic of an earthquake swarm — a cluster of small earthquakes occurring close together.
              </p>
            </div>
            <a 
              href="https://earthquake.usgs.gov/earthquakes/eventpage/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
            >
              USGS <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {activeTab === 'live' && (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="This Week"
                value={realtimeQuakes.length}
                subtext="earthquakes in Bay Area"
                icon={<Activity className="w-4 h-4" />}
              />
              <StatCard
                label="Felt by People"
                value={feltCount}
                subtext={`M2.5+ quakes`}
                icon={<Users className="w-4 h-4" />}
              />
              <StatCard
                label="Largest"
                value={largestRecent?.magnitude.toFixed(1) || '—'}
                subtext={largestRecent ? getMagnitudeLabel(largestRecent.magnitude) : 'No data'}
                icon={<Zap className="w-4 h-4" />}
                highlight={Boolean(largestRecent && largestRecent.magnitude >= 3)}
              />
              <StatCard
                label="San Ramon Area"
                value={sanRamonCount}
                subtext={isElevated ? 'Elevated activity' : 'Normal range'}
                icon={<MapPin className="w-4 h-4" />}
                highlight={isElevated}
              />
            </div>

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
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
            <HistoricalSwarms 
              earthquakes={allHistoricalQuakes}
            />
            
            {/* Historical Context */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4">15 Years of Data</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Total Earthquakes</span>
                    <span className="text-2xl font-light">{historicalData.summary.totalCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Swarm Events Detected</span>
                    <span className="text-2xl font-light">{historicalData.swarms.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-neutral-400">Largest Recorded</span>
                    <span className="text-2xl font-light">M{historicalData.biggestQuake?.magnitude.toFixed(1)}</span>
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
                  {historicalData.regionStats
                    .filter(r => r.totalCount > 0)
                    .sort((a, b) => b.totalCount - a.totalCount)
                    .slice(0, 4)
                    .map(stat => {
                      const region = getRegionById(stat.regionId);
                      const maxCount = Math.max(...historicalData.regionStats.map(r => r.totalCount));
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
          <>
            {/* Educational Content */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">What is an Earthquake Swarm?</h3>
                <p className="text-neutral-400 leading-relaxed">
                  An earthquake swarm is a series of many small earthquakes occurring in a localized area 
                  over days to weeks, without a clear mainshock-aftershock pattern. Unlike typical earthquake 
                  sequences where one large quake triggers smaller aftershocks, swarms involve numerous 
                  similar-sized events.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-light">5-50+</div>
                    <div className="text-xs text-neutral-500 mt-1">Typical events</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-light">1-72h</div>
                    <div className="text-xs text-neutral-500 mt-1">Duration</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-light">&lt;10km</div>
                    <div className="text-xs text-neutral-500 mt-1">Cluster radius</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Are Swarms Dangerous?</h3>
                <p className="text-neutral-400 leading-relaxed">
                  Most earthquake swarms consist entirely of small earthquakes and pose no danger. 
                  However, scientists study them carefully because they occasionally precede larger earthquakes. 
                  The vast majority end without producing a significant event.
                </p>
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Info className="w-4 h-4" />
                    Good to know
                  </div>
                  <p className="text-sm text-emerald-200/80 mt-2">
                    The San Ramon area has experienced dozens of swarm events since 2010. 
                    None have resulted in damaging earthquakes.
                  </p>
                </div>
              </div>
            </section>

            {/* Magnitude Scale */}
            <section className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Understanding Magnitude</h3>
              <p className="text-neutral-400 mb-6">
                The Richter magnitude scale is logarithmic — each whole number increase represents 
                10× more ground motion and about 31× more energy released.
              </p>
              <div className="space-y-3">
                {[
                  { mag: 2, label: 'Micro', desc: 'Rarely felt, recorded by seismometers' },
                  { mag: 3, label: 'Minor', desc: 'Felt by many, rarely causes damage' },
                  { mag: 4, label: 'Light', desc: 'Shaking felt indoors, rattling sounds' },
                  { mag: 5, label: 'Moderate', desc: 'Can cause damage to weak structures' },
                  { mag: 6, label: 'Strong', desc: 'Damaging to populated areas' },
                  { mag: 7, label: 'Major', desc: 'Serious damage over large areas' },
                ].map(item => (
                  <div key={item.mag} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-lg">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: getMagnitudeColor(item.mag) }}
                    >
                      {item.mag}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-neutral-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Resources */}
            <section className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Resources & Preparedness</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'USGS Earthquake Hazards', url: 'https://earthquake.usgs.gov/', desc: 'Official USGS earthquake monitoring' },
                  { title: 'UC Berkeley Seismology Lab', url: 'https://seismo.berkeley.edu/', desc: 'Research and monitoring for Northern California' },
                  { title: 'Ready.gov Earthquakes', url: 'https://www.ready.gov/earthquakes', desc: 'Emergency preparedness guide' },
                  { title: 'ShakeAlert', url: 'https://www.shakealert.org/', desc: 'Early warning system for the West Coast' },
                ].map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium group-hover:text-blue-400 transition-colors">{link.title}</span>
                      <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{link.desc}</p>
                  </a>
                ))}
              </div>
            </section>
          </>
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
  highlight = false 
}: { 
  label: string; 
  value: string | number; 
  subtext: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
      <div className="flex items-center gap-2 text-neutral-500 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-light ${highlight ? 'text-amber-400' : ''}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{subtext}</div>
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
        ${isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
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
              <span className="text-amber-400 flex items-center gap-1">
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
