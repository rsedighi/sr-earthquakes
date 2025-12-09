'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, getYear, differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import { Earthquake, SwarmEvent } from '@/lib/types';
import { REGIONS, getRegionById } from '@/lib/regions';
import { detectSwarms, getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  TrendingUp,
  Zap,
  BarChart3,
  ExternalLink,
  Filter,
  Layers,
  X,
  ArrowLeft,
  ArrowUpRight,
  Users,
  MapPin,
  Search,
  SortAsc,
  SortDesc,
  Hash,
  Gauge,
  Timer,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { EarthquakeDetailModal } from './earthquake-detail-modal';

interface HistoricalSwarmsProps {
  earthquakes: Earthquake[];
  className?: string;
}

interface YearlySwarmData {
  year: number;
  swarms: SwarmEvent[];
  totalEarthquakes: number;
  peakMagnitude: number;
  totalSwarmQuakes: number;
  avgSwarmSize: number;
  longestSwarmHours: number;
  magnitudeCounts: {
    m2plus: number;
    m3plus: number;
    m4plus: number;
    m5plus: number;
  };
}

// Group swarms by year for a specific region
function groupSwarmsByYear(earthquakes: Earthquake[], regionId: string): YearlySwarmData[] {
  const regionQuakes = earthquakes.filter(eq => eq.region === regionId);
  const swarms = detectSwarms(regionQuakes);
  
  // Get all years with data
  const years = new Set<number>();
  regionQuakes.forEach(eq => years.add(getYear(eq.time)));
  
  const yearlyData: YearlySwarmData[] = [];
  
  Array.from(years).sort((a, b) => b - a).forEach(year => {
    const yearQuakes = regionQuakes.filter(eq => getYear(eq.time) === year);
    const yearSwarms = swarms.filter(s => getYear(s.startTime) === year);
    
    const totalSwarmQuakes = yearSwarms.reduce((sum, s) => sum + s.totalCount, 0);
    const longestSwarm = yearSwarms.length > 0 
      ? Math.max(...yearSwarms.map(s => differenceInHours(s.endTime, s.startTime)))
      : 0;
    
    yearlyData.push({
      year,
      swarms: yearSwarms,
      totalEarthquakes: yearQuakes.length,
      peakMagnitude: yearQuakes.length > 0 ? Math.max(...yearQuakes.map(eq => eq.magnitude)) : 0,
      totalSwarmQuakes,
      avgSwarmSize: yearSwarms.length > 0 ? totalSwarmQuakes / yearSwarms.length : 0,
      longestSwarmHours: longestSwarm,
      magnitudeCounts: {
        m2plus: yearQuakes.filter(eq => eq.magnitude >= 2).length,
        m3plus: yearQuakes.filter(eq => eq.magnitude >= 3).length,
        m4plus: yearQuakes.filter(eq => eq.magnitude >= 4).length,
        m5plus: yearQuakes.filter(eq => eq.magnitude >= 5).length,
      },
    });
  });
  
  return yearlyData;
}

// Get swarm intensity level
function getSwarmIntensity(swarm: SwarmEvent): 'low' | 'moderate' | 'high' | 'extreme' {
  if (swarm.peakMagnitude >= 4 || swarm.totalCount >= 50) return 'extreme';
  if (swarm.peakMagnitude >= 3.5 || swarm.totalCount >= 30) return 'high';
  if (swarm.peakMagnitude >= 3 || swarm.totalCount >= 15) return 'moderate';
  return 'low';
}

const intensityColors = {
  low: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  moderate: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  high: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  extreme: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
};

export function HistoricalSwarms({ earthquakes, className = '' }: HistoricalSwarmsProps) {
  const [selectedRegion, setSelectedRegion] = useState('san-ramon');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2024, 2023, 2022]));
  const [showAllSwarms, setShowAllSwarms] = useState(false);
  const [minMagnitude, setMinMagnitude] = useState(0);
  
  // Drill-down state
  const [selectedSwarm, setSelectedSwarm] = useState<SwarmEvent | null>(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  
  const region = getRegionById(selectedRegion);
  
  // Get yearly swarm data for selected region
  const yearlyData = useMemo(() => 
    groupSwarmsByYear(earthquakes, selectedRegion),
    [earthquakes, selectedRegion]
  );
  
  // Filter data by minimum magnitude
  const filteredYearlyData = useMemo(() => {
    if (minMagnitude === 0) return yearlyData;
    return yearlyData.map(yd => ({
      ...yd,
      swarms: yd.swarms.filter(s => s.peakMagnitude >= minMagnitude)
    })).filter(yd => yd.swarms.length > 0 || yd.peakMagnitude >= minMagnitude);
  }, [yearlyData, minMagnitude]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const allSwarms = yearlyData.flatMap(yd => yd.swarms);
    return {
      totalSwarms: allSwarms.length,
      totalYears: yearlyData.length,
      biggestSwarm: allSwarms.length > 0 
        ? allSwarms.reduce((max, s) => s.totalCount > max.totalCount ? s : max)
        : null,
      strongestSwarm: allSwarms.length > 0
        ? allSwarms.reduce((max, s) => s.peakMagnitude > max.peakMagnitude ? s : max)
        : null,
      totalM2Plus: yearlyData.reduce((sum, yd) => sum + yd.magnitudeCounts.m2plus, 0),
      totalM3Plus: yearlyData.reduce((sum, yd) => sum + yd.magnitudeCounts.m3plus, 0),
      totalM4Plus: yearlyData.reduce((sum, yd) => sum + yd.magnitudeCounts.m4plus, 0),
    };
  }, [yearlyData]);
  
  // Toggle year expansion
  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };
  
  // Get the max values for scaling bars
  const maxSwarmCount = Math.max(...yearlyData.map(yd => yd.swarms.length), 1);
  
  // Handle drill-down into swarm
  const openSwarmDetail = useCallback((swarm: SwarmEvent) => {
    setSelectedSwarm(swarm);
  }, []);
  
  const closeSwarmDetail = useCallback(() => {
    setSelectedSwarm(null);
  }, []);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Historical Swarm Analysis</h2>
            <p className="text-sm text-neutral-500">Compare earthquake swarms across years • Click any swarm to drill down</p>
          </div>
        </div>
      </div>
      
      {/* Region Selector & Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Region Dropdown */}
        <div className="relative flex-1 min-w-[200px]">
          <label className="text-xs text-neutral-500 mb-1.5 block">Select Region</label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors text-left"
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: region?.color }}
            />
            <span className="flex-1 truncate">{region?.name}</span>
            <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 animate-fade-in max-h-[300px] overflow-y-auto">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRegion(r.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left ${
                    selectedRegion === r.id ? 'bg-white/5' : ''
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{r.name}</div>
                    <div className="text-xs text-neutral-500">{r.faultLine}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Magnitude Filter */}
        <div className="w-[160px]">
          <label className="text-xs text-neutral-500 mb-1.5 block flex items-center gap-1">
            <Filter className="w-3 h-3" /> Min Magnitude
          </label>
          <select
            value={minMagnitude}
            onChange={(e) => setMinMagnitude(Number(e.target.value))}
            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20"
          >
            <option value={0}>All Swarms</option>
            <option value={2.5}>M2.5+</option>
            <option value={3}>M3.0+</option>
            <option value={3.5}>M3.5+</option>
            <option value={4}>M4.0+</option>
          </select>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Swarms</span>
          </div>
          <div className="text-3xl font-light" style={{ color: region?.color }}>
            {totals.totalSwarms}
          </div>
          <div className="text-xs text-neutral-500 mt-1">detected events</div>
        </div>
        
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Gauge className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">M3+ Quakes</span>
          </div>
          <div className="text-3xl font-light text-yellow-400">{totals.totalM3Plus}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {totals.totalM4Plus > 0 ? `(${totals.totalM4Plus} were M4+)` : 'felt by many'}
          </div>
        </div>
        
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Largest Swarm</span>
          </div>
          <div className="text-3xl font-light">
            {totals.biggestSwarm?.totalCount || '—'}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {totals.biggestSwarm ? format(totals.biggestSwarm.startTime, 'MMM yyyy') : 'No swarms'}
          </div>
        </div>
        
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Peak Magnitude</span>
          </div>
          <div className="text-3xl font-light" style={{ color: totals.strongestSwarm ? getMagnitudeColor(totals.strongestSwarm.peakMagnitude) : undefined }}>
            {totals.strongestSwarm ? `M${totals.strongestSwarm.peakMagnitude.toFixed(1)}` : '—'}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {totals.strongestSwarm ? format(totals.strongestSwarm.startTime, 'MMM yyyy') : 'In swarms'}
          </div>
        </div>
      </div>
      
      {/* Year-by-Year Comparison Chart */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          Swarm Activity by Year
        </h3>
        
        <div className="space-y-3">
          {filteredYearlyData.slice(0, showAllSwarms ? undefined : 8).map((yd) => (
            <div key={yd.year} className="space-y-2">
              <button
                onClick={() => toggleYear(yd.year)}
                className="w-full flex items-center gap-4 group"
              >
                <span className="text-sm font-mono text-neutral-400 w-12">{yd.year}</span>
                
                {/* Swarm count bar */}
                <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full rounded-lg transition-all duration-500 flex items-center px-3 gap-3"
                    style={{ 
                      width: `${Math.max((yd.swarms.length / maxSwarmCount) * 100, 5)}%`,
                      backgroundColor: region?.color + '40'
                    }}
                  >
                    {yd.swarms.length > 0 && (
                      <span className="text-xs font-medium whitespace-nowrap" style={{ color: region?.color }}>
                        {yd.swarms.length} swarm{yd.swarms.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Magnitude counts overlay */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {yd.magnitudeCounts.m3plus > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                        {yd.magnitudeCounts.m3plus} M3+
                      </span>
                    )}
                    {yd.magnitudeCounts.m4plus > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                        {yd.magnitudeCounts.m4plus} M4+
                      </span>
                    )}
                    {yd.peakMagnitude >= 3 && (
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: getMagnitudeColor(yd.peakMagnitude) + '30',
                          color: getMagnitudeColor(yd.peakMagnitude)
                        }}
                      >
                        Peak {yd.peakMagnitude.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                
                <ChevronDown 
                  className={`w-4 h-4 text-neutral-600 transition-transform ${
                    expandedYears.has(yd.year) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {/* Expanded swarm details */}
              {expandedYears.has(yd.year) && yd.swarms.length > 0 && (
                <div className="ml-16 space-y-2 animate-fade-in">
                  {yd.swarms.map((swarm) => {
                    const intensity = getSwarmIntensity(swarm);
                    const durationHours = differenceInHours(swarm.endTime, swarm.startTime);
                    const durationText = durationHours < 24 
                      ? `${durationHours}h` 
                      : `${differenceInDays(swarm.endTime, swarm.startTime)}d`;
                    
                    // Calculate magnitude breakdown for this swarm
                    const swarmM2Plus = swarm.earthquakes.filter(eq => eq.magnitude >= 2).length;
                    const swarmM3Plus = swarm.earthquakes.filter(eq => eq.magnitude >= 3).length;
                    
                    return (
                      <button
                        key={swarm.id}
                        onClick={() => openSwarmDetail(swarm)}
                        className={`w-full p-4 rounded-xl border ${intensityColors[intensity].bg} ${intensityColors[intensity].border} text-left hover:ring-2 hover:ring-white/20 transition-all group`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{format(swarm.startTime, 'MMM d, yyyy')}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColors[intensity].bg} ${intensityColors[intensity].text}`}>
                                {intensity}
                              </span>
                              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {swarm.totalCount} earthquakes
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {durationText} duration
                              </span>
                              <span className="flex items-center gap-1" style={{ color: getMagnitudeColor(swarm.peakMagnitude) }}>
                                <Zap className="w-3 h-3" />
                                Peak M{swarm.peakMagnitude.toFixed(1)}
                              </span>
                            </div>
                            {/* Magnitude breakdown */}
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {swarmM2Plus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-400">
                                  {swarmM2Plus} M2+
                                </span>
                              )}
                              {swarmM3Plus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                                  {swarmM3Plus} M3+
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Mini timeline showing earthquake distribution */}
                          <div className="hidden sm:flex items-center gap-0.5">
                            {swarm.earthquakes.slice(0, 20).map((eq, i) => (
                              <div
                                key={i}
                                className="w-1 rounded-full"
                                style={{
                                  height: `${Math.max(eq.magnitude * 6, 8)}px`,
                                  backgroundColor: getMagnitudeColor(eq.magnitude),
                                  opacity: 0.8
                                }}
                                title={`M${eq.magnitude.toFixed(1)}`}
                              />
                            ))}
                            {swarm.earthquakes.length > 20 && (
                              <span className="text-xs text-neutral-500 ml-1">+{swarm.earthquakes.length - 20}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {expandedYears.has(yd.year) && yd.swarms.length === 0 && (
                <div className="ml-16 p-4 text-sm text-neutral-500 bg-white/[0.02] rounded-xl">
                  No swarm events detected in {yd.year} • {yd.totalEarthquakes} total earthquakes ({yd.magnitudeCounts.m2plus} M2+)
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredYearlyData.length > 8 && !showAllSwarms && (
          <button
            onClick={() => setShowAllSwarms(true)}
            className="mt-4 w-full py-3 text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Show all {filteredYearlyData.length} years
          </button>
        )}
      </div>
      
      {/* Notable Swarms Comparison */}
      {totals.totalSwarms > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500" />
            Notable Swarms Comparison
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Comparing the most significant swarm events in {region?.name} • Click to explore
          </p>
          
          <div className="space-y-4">
            {yearlyData
              .flatMap(yd => yd.swarms)
              .sort((a, b) => b.totalCount - a.totalCount)
              .slice(0, 5)
              .map((swarm, idx) => {
                const intensity = getSwarmIntensity(swarm);
                const durationHours = differenceInHours(swarm.endTime, swarm.startTime);
                const maxSwarmSize = Math.max(...yearlyData.flatMap(yd => yd.swarms).map(s => s.totalCount), 1);
                const swarmM3Plus = swarm.earthquakes.filter(eq => eq.magnitude >= 3).length;
                
                return (
                  <button
                    key={swarm.id}
                    onClick={() => openSwarmDetail(swarm)}
                    className="w-full text-left relative group"
                  >
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-neutral-500">
                        #{idx + 1}
                      </div>
                      
                      {/* Swarm info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{format(swarm.startTime, 'MMMM d, yyyy')}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColors[intensity].bg} ${intensityColors[intensity].text}`}>
                            {swarm.totalCount} quakes
                          </span>
                          {swarmM3Plus > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                              {swarmM3Plus} M3+
                            </span>
                          )}
                        </div>
                        
                        {/* Progress bar showing relative size */}
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(swarm.totalCount / maxSwarmSize) * 100}%`,
                              backgroundColor: getMagnitudeColor(swarm.peakMagnitude)
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          <span>Peak M{swarm.peakMagnitude.toFixed(1)}</span>
                          <span>•</span>
                          <span>{durationHours < 24 ? `${durationHours} hours` : `${Math.round(durationHours / 24)} days`}</span>
                        </div>
                      </div>
                      
                      {/* Peak magnitude badge */}
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ 
                          backgroundColor: getMagnitudeColor(swarm.peakMagnitude) + '20',
                          color: getMagnitudeColor(swarm.peakMagnitude)
                        }}
                      >
                        {swarm.peakMagnitude.toFixed(1)}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })}
          </div>
          
          {totals.totalSwarms === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No swarm events detected for this region</p>
            </div>
          )}
        </div>
      )}
      
      {/* Insight Section */}
      {totals.totalSwarms > 0 && (
        <div className="p-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
          <h4 className="font-medium text-orange-100 mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Swarm Activity Insight
          </h4>
          <p className="text-sm text-orange-200/80 leading-relaxed">
            {generateSwarmInsight(yearlyData, region?.name || 'This region')}
          </p>
        </div>
      )}
      
      {/* Swarm Drill-Down Modal - Datadog Style */}
      {selectedSwarm && (
        <SwarmDrillDown 
          swarm={selectedSwarm} 
          region={region}
          onClose={closeSwarmDetail}
          onEarthquakeClick={(eq) => setSelectedEarthquake(eq)}
        />
      )}
      
      {/* Individual Earthquake Detail Modal */}
      {selectedEarthquake && (
        <EarthquakeDetailModal
          earthquake={selectedEarthquake}
          onClose={() => setSelectedEarthquake(null)}
          breadcrumb={selectedSwarm ? `${format(selectedSwarm.startTime, 'MMM d, yyyy')} Swarm` : 'Historical Swarms'}
          allEarthquakes={earthquakes}
        />
      )}
    </div>
  );
}

// Datadog-style Drill-Down Component
interface SwarmDrillDownProps {
  swarm: SwarmEvent;
  region: ReturnType<typeof getRegionById>;
  onClose: () => void;
  onEarthquakeClick?: (earthquake: Earthquake) => void;
}

function SwarmDrillDown({ swarm, region, onClose, onEarthquakeClick }: SwarmDrillDownProps) {
  const [sortBy, setSortBy] = useState<'time' | 'magnitude' | 'depth'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minMagFilter, setMinMagFilter] = useState(0);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  const intensity = getSwarmIntensity(swarm);
  const durationHours = differenceInHours(swarm.endTime, swarm.startTime);
  
  // Sort and filter earthquakes
  const filteredEarthquakes = useMemo(() => {
    let result = [...swarm.earthquakes];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(eq => 
        eq.place.toLowerCase().includes(query) ||
        eq.magnitude.toString().includes(query)
      );
    }
    
    // Apply magnitude filter
    if (minMagFilter > 0) {
      result = result.filter(eq => eq.magnitude >= minMagFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'time':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'magnitude':
          comparison = a.magnitude - b.magnitude;
          break;
        case 'depth':
          comparison = a.depth - b.depth;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [swarm.earthquakes, sortBy, sortOrder, searchQuery, minMagFilter]);
  
  // Calculate swarm statistics
  const stats = useMemo(() => {
    const mags = swarm.earthquakes.map(eq => eq.magnitude);
    const depths = swarm.earthquakes.map(eq => eq.depth);
    const feltQuakes = swarm.earthquakes.filter(eq => eq.felt && eq.felt > 0);
    
    return {
      avgMagnitude: mags.reduce((a, b) => a + b, 0) / mags.length,
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      minDepth: Math.min(...depths),
      maxDepth: Math.max(...depths),
      feltCount: feltQuakes.length,
      totalFeltReports: feltQuakes.reduce((sum, eq) => sum + (eq.felt || 0), 0),
      m2Plus: swarm.earthquakes.filter(eq => eq.magnitude >= 2).length,
      m3Plus: swarm.earthquakes.filter(eq => eq.magnitude >= 3).length,
      m4Plus: swarm.earthquakes.filter(eq => eq.magnitude >= 4).length,
    };
  }, [swarm.earthquakes]);
  
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-5xl m-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Datadog Style Breadcrumb */}
        <div className="bg-neutral-900 border border-white/10 rounded-t-2xl p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Historical Swarms
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-300">{region?.name}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{format(swarm.startTime, 'MMMM d, yyyy')} Swarm</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">Swarm Event Details</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${intensityColors[intensity].bg} ${intensityColors[intensity].text} uppercase font-medium`}>
                  {intensity} intensity
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                {format(swarm.startTime, 'PPP p')} → {format(swarm.endTime, 'PPP p')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats Overview - Datadog Metric Cards */}
        <div className="bg-neutral-900/80 border-x border-white/10 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard
              icon={<Hash className="w-4 h-4" />}
              label="Total Quakes"
              value={swarm.totalCount.toString()}
              color={region?.color}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Peak Magnitude"
              value={`M${swarm.peakMagnitude.toFixed(1)}`}
              color={getMagnitudeColor(swarm.peakMagnitude)}
            />
            <MetricCard
              icon={<Timer className="w-4 h-4" />}
              label="Duration"
              value={durationHours < 24 ? `${durationHours}h` : `${Math.round(durationHours / 24)}d`}
            />
            <MetricCard
              icon={<Gauge className="w-4 h-4" />}
              label="Avg Magnitude"
              value={`M${stats.avgMagnitude.toFixed(2)}`}
            />
            <MetricCard
              icon={<MapPin className="w-4 h-4" />}
              label="Avg Depth"
              value={`${stats.avgDepth.toFixed(1)}km`}
            />
            <MetricCard
              icon={<Users className="w-4 h-4" />}
              label="Felt Reports"
              value={stats.totalFeltReports.toString()}
              subtext={`${stats.feltCount} quakes`}
            />
          </div>
          
          {/* Magnitude Distribution */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-neutral-500">Magnitude Distribution:</span>
            <span className="px-2 py-1 rounded bg-lime-500/20 text-lime-400 text-xs font-medium">
              {stats.m2Plus} M2+
            </span>
            <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              {stats.m3Plus} M3+
            </span>
            {stats.m4Plus > 0 && (
              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-medium">
                {stats.m4Plus} M4+
              </span>
            )}
          </div>
        </div>
        
        {/* Filters & Search - Datadog Style Toolbar */}
        <div className="bg-neutral-800/50 border-x border-white/10 p-3 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search earthquakes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 placeholder:text-neutral-600"
            />
          </div>
          
          {/* Magnitude Filter */}
          <select
            value={minMagFilter}
            onChange={(e) => setMinMagFilter(Number(e.target.value))}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
          >
            <option value={0}>All magnitudes</option>
            <option value={1}>M1.0+</option>
            <option value={2}>M2.0+</option>
            <option value={3}>M3.0+</option>
          </select>
          
          {/* Results count */}
          <span className="text-sm text-neutral-500">
            {filteredEarthquakes.length} of {swarm.totalCount} earthquakes
          </span>
        </div>
        
        {/* Earthquake Table - Datadog Log Viewer Style */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-b-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[80px_1fr_100px_80px_80px] gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-neutral-400 uppercase tracking-wider">
            <button 
              onClick={() => toggleSort('time')}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Time
              {sortBy === 'time' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
            <span>Location</span>
            <button 
              onClick={() => toggleSort('magnitude')}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Magnitude
              {sortBy === 'magnitude' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
            <button 
              onClick={() => toggleSort('depth')}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Depth
              {sortBy === 'depth' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
            <span>Actions</span>
          </div>
          
          {/* Table Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredEarthquakes.map((eq, idx) => (
              <div 
                key={`${eq.id}-${idx}`}
                onClick={() => onEarthquakeClick?.(eq)}
                className={`grid grid-cols-[80px_1fr_100px_80px_80px] gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group ${
                  eq.magnitude >= 3 ? 'bg-yellow-500/5' : ''
                } ${eq.magnitude >= 4 ? 'bg-orange-500/5' : ''}`}
              >
                {/* Time */}
                <div className="text-xs">
                  <div className="text-neutral-300 font-mono">{format(eq.time, 'HH:mm:ss')}</div>
                  <div className="text-neutral-600">{format(eq.time, 'MMM d')}</div>
                </div>
                
                {/* Location */}
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getMagnitudeColor(eq.magnitude) }}
                  />
                  <span className="text-sm truncate group-hover:text-white transition-colors">{eq.place}</span>
                  {eq.felt && eq.felt > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 flex-shrink-0">
                      {eq.felt} felt
                    </span>
                  )}
                </div>
                
                {/* Magnitude */}
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-bold"
                    style={{ color: getMagnitudeColor(eq.magnitude) }}
                  >
                    {eq.magnitude.toFixed(2)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {getMagnitudeLabel(eq.magnitude)}
                  </span>
                </div>
                
                {/* Depth */}
                <div className="text-sm text-neutral-400">
                  {eq.depth.toFixed(1)} km
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEarthquakeClick?.(eq);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-neutral-500 group-hover:text-blue-400" />
                  </button>
                  <a
                    href={eq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="View on USGS"
                  >
                    <ExternalLink className="w-4 h-4 text-neutral-500 hover:text-white" />
                  </a>
                </div>
              </div>
            ))}
            
            {filteredEarthquakes.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No earthquakes match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  subtext,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
      <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold" style={{ color }}>{value}</div>
      {subtext && <div className="text-xs text-neutral-600">{subtext}</div>}
    </div>
  );
}

// Generate natural language insight about swarm patterns
function generateSwarmInsight(yearlyData: YearlySwarmData[], regionName: string): string {
  const allSwarms = yearlyData.flatMap(yd => yd.swarms);
  if (allSwarms.length === 0) {
    return `${regionName} has not experienced any detected earthquake swarms in the historical record.`;
  }
  
  const totalSwarms = allSwarms.length;
  const yearsWithSwarms = yearlyData.filter(yd => yd.swarms.length > 0).length;
  const avgPerYear = totalSwarms / Math.max(yearlyData.length, 1);
  
  const biggestSwarm = allSwarms.reduce((max, s) => s.totalCount > max.totalCount ? s : max);
  const strongestSwarm = allSwarms.reduce((max, s) => s.peakMagnitude > max.peakMagnitude ? s : max);
  
  const totalM3Plus = yearlyData.reduce((sum, yd) => sum + yd.magnitudeCounts.m3plus, 0);
  
  const recentYears = yearlyData.slice(0, 3);
  const olderYears = yearlyData.slice(3, 6);
  const recentSwarms = recentYears.reduce((sum, yd) => sum + yd.swarms.length, 0);
  const olderSwarms = olderYears.reduce((sum, yd) => sum + yd.swarms.length, 0);
  
  let insight = `${regionName} has experienced ${totalSwarms} earthquake swarms across ${yearsWithSwarms} different years`;
  
  insight += `, averaging about ${avgPerYear.toFixed(1)} swarms per year. `;
  
  insight += `The largest swarm occurred in ${format(biggestSwarm.startTime, 'MMMM yyyy')} with ${biggestSwarm.totalCount} earthquakes`;
  
  if (biggestSwarm.id !== strongestSwarm.id) {
    insight += `, while the most powerful swarm (M${strongestSwarm.peakMagnitude.toFixed(1)} peak) was in ${format(strongestSwarm.startTime, 'MMMM yyyy')}`;
  }
  
  insight += `. `;
  
  if (totalM3Plus > 0) {
    insight += `There have been ${totalM3Plus} magnitude 3+ earthquakes total. `;
  }
  
  // Trend analysis
  if (recentSwarms > olderSwarms * 1.5) {
    insight += 'Swarm activity has increased in recent years.';
  } else if (recentSwarms < olderSwarms * 0.5) {
    insight += 'Swarm activity has decreased compared to earlier years.';
  } else {
    insight += 'Swarm activity has remained relatively consistent over time.';
  }
  
  return insight;
}
