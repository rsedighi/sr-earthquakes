'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, getYear, differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import { Earthquake, SwarmEvent, SwarmEpisode, DailyActivityCluster } from '@/lib/types';
import { REGIONS, getRegionById } from '@/lib/regions';
import { detectSwarms, detectSwarmEpisodes, getMagnitudeColor, getMagnitudeLabel } from '@/lib/analysis';
import { formatDepth } from '@/lib/units';
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
  episodes: SwarmEpisode[];
  totalEarthquakes: number;
  peakMagnitude: number;
  totalEpisodeQuakes: number;
  avgEpisodeSize: number;
  longestEpisodeDays: number;
  magnitudeCounts: {
    m2plus: number;
    m3plus: number;
    m4plus: number;
    m5plus: number;
  };
}

// Group swarm episodes by year for a specific region
function groupSwarmsByYear(earthquakes: Earthquake[], regionId: string): YearlySwarmData[] {
  const regionQuakes = earthquakes.filter(eq => eq.region === regionId);
  const episodes = detectSwarmEpisodes(regionQuakes);
  
  // Get all years with data
  const years = new Set<number>();
  regionQuakes.forEach(eq => years.add(getYear(eq.time)));
  
  const yearlyData: YearlySwarmData[] = [];
  
  Array.from(years).sort((a, b) => b - a).forEach(year => {
    const yearQuakes = regionQuakes.filter(eq => getYear(eq.time) === year);
    const yearEpisodes = episodes.filter(e => getYear(e.startTime) === year);
    
    const totalEpisodeQuakes = yearEpisodes.reduce((sum, e) => sum + e.totalCount, 0);
    const longestEpisode = yearEpisodes.length > 0 
      ? Math.max(...yearEpisodes.map(e => e.durationDays))
      : 0;
    
    yearlyData.push({
      year,
      episodes: yearEpisodes,
      totalEarthquakes: yearQuakes.length,
      peakMagnitude: yearQuakes.length > 0 ? Math.max(...yearQuakes.map(eq => eq.magnitude)) : 0,
      totalEpisodeQuakes,
      avgEpisodeSize: yearEpisodes.length > 0 ? totalEpisodeQuakes / yearEpisodes.length : 0,
      longestEpisodeDays: longestEpisode,
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

// Get episode intensity colors
const episodeIntensityColors = {
  minor: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-neutral-500', color: '#6b7280' },
  moderate: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', color: '#eab308' },
  significant: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', color: '#f97316' },
  major: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', color: '#ef4444' },
};

// Get daily activity intensity colors
const dailyIntensityColors = {
  quiet: { bg: 'bg-neutral-800', text: 'text-neutral-600', dot: '#3f3f46' },
  low: { bg: 'bg-green-500/20', text: 'text-green-400', dot: '#22c55e' },
  moderate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: '#eab308' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: '#f97316' },
  extreme: { bg: 'bg-red-500/20', text: 'text-red-400', dot: '#ef4444' },
};

const intensityColors = {
  low: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-neutral-500' },
  moderate: { bg: 'bg-white/10', border: 'border-white/15', text: 'text-neutral-400' },
  high: { bg: 'bg-white/15', border: 'border-white/20', text: 'text-neutral-300' },
  extreme: { bg: 'bg-white/20', border: 'border-white/30', text: 'text-white' },
};

export function HistoricalSwarms({ earthquakes, className = '' }: HistoricalSwarmsProps) {
  const [selectedRegion, setSelectedRegion] = useState('san-ramon');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2024, 2023, 2022]));
  const [showAllSwarms, setShowAllSwarms] = useState(false);
  const [minMagnitude, setMinMagnitude] = useState(0);
  
  // Drill-down state
  const [selectedEpisode, setSelectedEpisode] = useState<SwarmEpisode | null>(null);
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
      episodes: yd.episodes.filter(e => e.peakMagnitude >= minMagnitude)
    })).filter(yd => yd.episodes.length > 0 || yd.peakMagnitude >= minMagnitude);
  }, [yearlyData, minMagnitude]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const allEpisodes = yearlyData.flatMap(yd => yd.episodes);
    return {
      totalEpisodes: allEpisodes.length,
      totalYears: yearlyData.length,
      biggestEpisode: allEpisodes.length > 0 
        ? allEpisodes.reduce((max, e) => e.totalCount > max.totalCount ? e : max)
        : null,
      strongestEpisode: allEpisodes.length > 0
        ? allEpisodes.reduce((max, e) => e.peakMagnitude > max.peakMagnitude ? e : max)
        : null,
      longestEpisode: allEpisodes.length > 0
        ? allEpisodes.reduce((max, e) => e.durationDays > max.durationDays ? e : max)
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
  const maxEpisodeCount = Math.max(...yearlyData.map(yd => yd.episodes.length), 1);
  
  // Handle drill-down into episode
  const openEpisodeDetail = useCallback((episode: SwarmEpisode) => {
    setSelectedEpisode(episode);
  }, []);
  
  const closeEpisodeDetail = useCallback(() => {
    setSelectedEpisode(null);
  }, []);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
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
            <span className="px-2.5 py-1 text-sm font-mono font-bold bg-white/15 rounded-lg text-white tracking-wider">
              {region?.areaCode}
            </span>
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
                    selectedRegion === r.id ? 'bg-white/10' : ''
                  }`}
                >
                  <span className={`px-2.5 py-1 text-sm font-mono font-bold rounded-lg tracking-wider flex-shrink-0 ${
                    selectedRegion === r.id ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-300'
                  }`}>
                    {r.areaCode}
                  </span>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Swarm Episodes</span>
            </div>
            <div className="text-3xl font-light text-white">
              {totals.totalEpisodes}
            </div>
            <div className="text-xs text-neutral-500 mt-1">multi-week events</div>
          </div>
          
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Gauge className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">M3+ Quakes</span>
            </div>
            <div className="text-3xl font-light text-white">{totals.totalM3Plus}</div>
            <div className="text-xs text-neutral-500 mt-1">
              {totals.totalM4Plus > 0 ? `(${totals.totalM4Plus} were M4+)` : 'felt by many'}
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Largest Episode</span>
            </div>
            <div className="text-3xl font-light text-white">
              {totals.biggestEpisode?.totalCount || '—'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {totals.biggestEpisode ? format(totals.biggestEpisode.startTime, 'MMM yyyy') : 'earthquakes'}
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Longest Episode</span>
            </div>
            <div className="text-3xl font-light text-white">
              {totals.longestEpisode ? `${totals.longestEpisode.durationDays}d` : '—'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {totals.longestEpisode ? format(totals.longestEpisode.startTime, 'MMM yyyy') : 'duration'}
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Peak Magnitude</span>
            </div>
            <div className="text-3xl font-light text-white">
              {totals.strongestEpisode ? `M${totals.strongestEpisode.peakMagnitude.toFixed(1)}` : '—'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {totals.strongestEpisode ? format(totals.strongestEpisode.startTime, 'MMM yyyy') : 'in episodes'}
            </div>
          </div>
        </div>
      
      {/* Year-by-Year Comparison Chart */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          Swarm Episodes by Year
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Episodes are multi-week periods of sustained seismic activity • Click to see daily breakdown
        </p>
        
        <div className="space-y-3">
          {filteredYearlyData.slice(0, showAllSwarms ? undefined : 8).map((yd) => (
            <div key={yd.year} className="space-y-2">
              <button
                onClick={() => toggleYear(yd.year)}
                className="w-full flex items-center gap-4 group"
              >
                <span className="text-sm font-mono text-neutral-400 w-12">{yd.year}</span>
                
                {/* Episode count bar - hover=cyan, selected=purple */}
                <div className={`flex-1 h-10 rounded-lg overflow-hidden relative transition-all duration-200 ${
                  expandedYears.has(yd.year) 
                    ? 'bg-violet-500/20 ring-2 ring-violet-500/40' 
                    : 'bg-white/5 hover:bg-cyan-500/10 group-hover:ring-2 group-hover:ring-cyan-500/30'
                }`}>
                  <div 
                    className={`h-full rounded-lg transition-all duration-500 flex items-center px-3 gap-3 ${
                      expandedYears.has(yd.year) ? '' : 'group-hover:brightness-125'
                    }`}
                    style={{ 
                      width: `${Math.max((yd.episodes.length / maxEpisodeCount) * 100, 5)}%`,
                      backgroundColor: expandedYears.has(yd.year) ? '#8b5cf6' + '50' : region?.color + '40'
                    }}
                  >
                    {yd.episodes.length > 0 && (
                      <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
                        expandedYears.has(yd.year) ? 'text-violet-300' : ''
                      }`} style={{ color: expandedYears.has(yd.year) ? undefined : region?.color }}>
                        {yd.episodes.length} episode{yd.episodes.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Hover indicator for expandable - cyan color */}
                  {!expandedYears.has(yd.year) && yd.episodes.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-xs text-cyan-400 bg-black/70 px-2 py-1 rounded-full flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        Click to expand
                      </span>
                    </div>
                  )}
                  
                  {/* Magnitude counts overlay */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {yd.magnitudeCounts.m3plus > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-medium">
                        {yd.magnitudeCounts.m3plus} M3+
                      </span>
                    )}
                    {yd.magnitudeCounts.m4plus > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-neutral-200 font-medium">
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
                  className={`w-4 h-4 transition-all duration-200 ${
                    expandedYears.has(yd.year) 
                      ? 'rotate-180 text-violet-400' 
                      : 'text-neutral-600 group-hover:text-cyan-400'
                  }`}
                />
              </button>
              
              {/* Expanded episode details - purple border for selected state */}
              {expandedYears.has(yd.year) && yd.episodes.length > 0 && (
                <div className="ml-16 space-y-3 animate-fade-in pl-4 border-l-2 border-violet-500/40">
                  {yd.episodes.map((episode) => {
                    const intensityColors = episodeIntensityColors[episode.intensity];
                    
                    // Calculate magnitude breakdown for this episode
                    const episodeM2Plus = episode.earthquakes.filter(eq => eq.magnitude >= 2).length;
                    const episodeM3Plus = episode.earthquakes.filter(eq => eq.magnitude >= 3).length;
                    
                    return (
                      <button
                        key={episode.id}
                        onClick={() => openEpisodeDetail(episode)}
                        className={`w-full p-4 rounded-xl border-2 border-dashed text-left hover:ring-2 hover:ring-cyan-500/40 transition-all group ${intensityColors.bg} ${intensityColors.border} hover:brightness-110`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Flame className={`w-4 h-4 ${intensityColors.text}`} />
                              <span className="font-medium">
                                {format(episode.startTime, 'MMM d')} – {format(episode.endTime, 'MMM d, yyyy')}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${intensityColors.bg} ${intensityColors.text} border ${intensityColors.border}`}>
                                {episode.intensity} episode
                              </span>
                              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {episode.totalCount} earthquakes
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {episode.durationDays} days ({episode.activeDays} active)
                              </span>
                              <span className="flex items-center gap-1" style={{ color: getMagnitudeColor(episode.peakMagnitude) }}>
                                <Zap className="w-3 h-3" />
                                Peak M{episode.peakMagnitude.toFixed(1)}
                              </span>
                            </div>
                            
                            {/* Magnitude breakdown */}
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {episodeM2Plus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                  {episodeM2Plus} M2+
                                </span>
                              )}
                              {episodeM3Plus > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  {episodeM3Plus} M3+
                                </span>
                              )}
                            </div>
                            
                            {/* Daily activity heatmap - shows each day's intensity */}
                            <div className="mt-3 flex flex-wrap items-center gap-1">
                              <span className="text-xs text-neutral-500 mr-2">Daily activity:</span>
                              {episode.dailyBreakdown.slice(0, 21).map((day, i) => (
                                <div
                                  key={i}
                                  className="w-3 h-3 rounded-sm"
                                  style={{ backgroundColor: dailyIntensityColors[day.intensity].dot }}
                                  title={`${format(day.date, 'MMM d')}: ${day.count} quakes${day.count > 0 ? `, Peak M${day.peakMagnitude.toFixed(1)}` : ''}`}
                                />
                              ))}
                              {episode.dailyBreakdown.length > 21 && (
                                <span className="text-xs text-neutral-500 ml-1">+{episode.dailyBreakdown.length - 21}d</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Peak day highlight */}
                          {episode.peakDay && (
                            <div className="hidden sm:block p-2 rounded-lg bg-white/5 text-center">
                              <div className="text-xs text-neutral-500">Peak Day</div>
                              <div className="text-lg font-bold" style={{ color: dailyIntensityColors[episode.peakDay.intensity].dot }}>
                                {episode.peakDay.count}
                              </div>
                              <div className="text-xs text-neutral-400">{format(episode.peakDay.date, 'MMM d')}</div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {expandedYears.has(yd.year) && yd.episodes.length === 0 && (
                <div className="ml-16 p-4 text-sm text-neutral-500 bg-white/[0.02] rounded-xl border-l-2 border-neutral-700">
                  No swarm episodes detected in {yd.year} • {yd.totalEarthquakes} total earthquakes ({yd.magnitudeCounts.m2plus} M2+)
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
      
      {/* Notable Episodes Comparison */}
      {totals.totalEpisodes > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500" />
            Notable Swarm Episodes
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Comparing the most significant multi-week swarm episodes in {region?.name} • Click to explore daily breakdown
          </p>
          
          <div className="space-y-4">
            {yearlyData
              .flatMap(yd => yd.episodes)
              .sort((a, b) => b.totalCount - a.totalCount)
              .slice(0, 5)
              .map((episode, idx) => {
                const colors = episodeIntensityColors[episode.intensity];
                const maxEpisodeSize = Math.max(...yearlyData.flatMap(yd => yd.episodes).map(e => e.totalCount), 1);
                const episodeM3Plus = episode.earthquakes.filter(eq => eq.magnitude >= 3).length;
                
                return (
                  <button
                    key={episode.id}
                    onClick={() => openEpisodeDetail(episode)}
                    className="w-full text-left relative group"
                  >
                    <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors border-2 border-dashed hover:ring-2 hover:ring-cyan-500/40 ${colors.bg} ${colors.border} hover:brightness-110`}>
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-neutral-400/20 text-neutral-300' :
                        idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                        'bg-white/5 text-neutral-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      
                      {/* Episode info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className={`w-4 h-4 ${colors.text}`} />
                          <span className="font-medium">
                            {format(episode.startTime, 'MMM d')} – {format(episode.endTime, 'MMM d, yyyy')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {episode.totalCount} quakes
                          </span>
                          {episodeM3Plus > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              {episodeM3Plus} M3+
                            </span>
                          )}
                        </div>
                        
                        {/* Progress bar showing relative size with color */}
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(episode.totalCount / maxEpisodeSize) * 100}%`,
                              backgroundColor: colors.color + '99'
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          <span style={{ color: getMagnitudeColor(episode.peakMagnitude) }}>Peak M{episode.peakMagnitude.toFixed(1)}</span>
                          <span>•</span>
                          <span>{episode.durationDays} days</span>
                          <span>•</span>
                          <span>{episode.activeDays} active days</span>
                        </div>
                      </div>
                      
                      {/* Peak magnitude badge with color */}
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{
                          backgroundColor: getMagnitudeColor(episode.peakMagnitude) + '20',
                          color: getMagnitudeColor(episode.peakMagnitude),
                          border: `2px solid ${getMagnitudeColor(episode.peakMagnitude)}40`
                        }}
                      >
                        {episode.peakMagnitude.toFixed(1)}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
          </div>
          
          {totals.totalEpisodes === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No swarm episodes detected for this region</p>
            </div>
          )}
        </div>
      )}
      
      {/* Insight Section */}
      {totals.totalEpisodes > 0 && (
        <div className="p-5 bg-white/[0.02] rounded-xl border border-white/10">
          <h4 className="font-medium text-neutral-200 mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Swarm Episode Insight
          </h4>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {generateEpisodeInsight(yearlyData, region?.name || 'This region')}
          </p>
        </div>
      )}
      
      {/* Episode Drill-Down Modal - Datadog Style */}
      {selectedEpisode && (
        <EpisodeDrillDown 
          episode={selectedEpisode} 
          region={region}
          onClose={closeEpisodeDetail}
          onEarthquakeClick={(eq) => setSelectedEarthquake(eq)}
        />
      )}
      
      {/* Individual Earthquake Detail Modal */}
      {selectedEarthquake && (
        <EarthquakeDetailModal
          earthquake={selectedEarthquake}
          onClose={() => setSelectedEarthquake(null)}
          breadcrumb={selectedEpisode ? `${format(selectedEpisode.startTime, 'MMM d')} – ${format(selectedEpisode.endTime, 'MMM d')} Episode` : 'Historical Swarms'}
          allEarthquakes={earthquakes}
        />
      )}
    </div>
  );
}

// Datadog-style Drill-Down Component for Episodes
interface EpisodeDrillDownProps {
  episode: SwarmEpisode;
  region: ReturnType<typeof getRegionById>;
  onClose: () => void;
  onEarthquakeClick?: (earthquake: Earthquake) => void;
}

function EpisodeDrillDown({ episode, region, onClose, onEarthquakeClick }: EpisodeDrillDownProps) {
  const [sortBy, setSortBy] = useState<'time' | 'magnitude' | 'depth'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minMagFilter, setMinMagFilter] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DailyActivityCluster | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDay) {
          setSelectedDay(null);
        } else {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, selectedDay]);
  
  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  const colors = episodeIntensityColors[episode.intensity];
  
  // Get earthquakes to display (either all or from selected day)
  const displayEarthquakes = useMemo(() => {
    const source = selectedDay ? selectedDay.earthquakes : episode.earthquakes;
    let result = [...source];
    
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
  }, [episode.earthquakes, selectedDay, sortBy, sortOrder, searchQuery, minMagFilter]);
  
  // Calculate episode statistics
  const stats = useMemo(() => {
    const mags = episode.earthquakes.map(eq => eq.magnitude);
    const depths = episode.earthquakes.map(eq => eq.depth);
    const feltQuakes = episode.earthquakes.filter(eq => eq.felt && eq.felt > 0);
    
    return {
      avgMagnitude: mags.reduce((a, b) => a + b, 0) / mags.length,
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      minDepth: Math.min(...depths),
      maxDepth: Math.max(...depths),
      feltCount: feltQuakes.length,
      totalFeltReports: feltQuakes.reduce((sum, eq) => sum + (eq.felt || 0), 0),
      m2Plus: episode.earthquakes.filter(eq => eq.magnitude >= 2).length,
      m3Plus: episode.earthquakes.filter(eq => eq.magnitude >= 3).length,
      m4Plus: episode.earthquakes.filter(eq => eq.magnitude >= 4).length,
    };
  }, [episode.earthquakes]);
  
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Get max count for scaling daily bars
  const maxDailyCount = Math.max(...episode.dailyBreakdown.map(d => d.count), 1);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-6xl m-4 my-8"
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
            <span className="text-white font-medium">
              {format(episode.startTime, 'MMM d')} – {format(episode.endTime, 'MMM d, yyyy')} Episode
            </span>
            {selectedDay && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-cyan-400">{format(selectedDay.date, 'MMMM d')}</span>
              </>
            )}
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">Swarm Episode Details</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} uppercase font-medium border ${colors.border}`}>
                  {episode.intensity}
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                {format(episode.startTime, 'PPP')} → {format(episode.endTime, 'PPP')} ({episode.durationDays} days)
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard
              icon={<Hash className="w-4 h-4" />}
              label="Total Quakes"
              value={episode.totalCount.toString()}
              color={region?.color}
            />
            <MetricCard
              icon={<Calendar className="w-4 h-4" />}
              label="Duration"
              value={`${episode.durationDays}d`}
              subtext={`${episode.activeDays} active`}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Peak Magnitude"
              value={`M${episode.peakMagnitude.toFixed(1)}`}
              color={getMagnitudeColor(episode.peakMagnitude)}
            />
            <MetricCard
              icon={<Gauge className="w-4 h-4" />}
              label="Avg Magnitude"
              value={`M${stats.avgMagnitude.toFixed(2)}`}
            />
            <MetricCard
              icon={<MapPin className="w-4 h-4" />}
              label="Avg Depth"
              value={formatDepth(stats.avgDepth)}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Peak Day"
              value={episode.peakDay ? episode.peakDay.count.toString() : '—'}
              subtext={episode.peakDay ? format(episode.peakDay.date, 'MMM d') : ''}
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
            <span className="px-2 py-1 rounded bg-white/10 text-neutral-400 text-xs font-medium">
              {stats.m2Plus} M2+
            </span>
            <span className="px-2 py-1 rounded bg-white/15 text-neutral-300 text-xs font-medium">
              {stats.m3Plus} M3+
            </span>
            {stats.m4Plus > 0 && (
              <span className="px-2 py-1 rounded bg-white/20 text-neutral-200 text-xs font-medium">
                {stats.m4Plus} M4+
              </span>
            )}
          </div>
        </div>
        
        {/* Daily Breakdown Section */}
        <div className="bg-neutral-800/50 border-x border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neutral-500" />
              Daily Activity Breakdown
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setViewMode('daily'); setSelectedDay(null); }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  viewMode === 'daily' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => { setViewMode('all'); setSelectedDay(null); }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  viewMode === 'all' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                All Quakes
              </button>
            </div>
          </div>
          
          {/* Daily bars */}
          <div className="grid grid-cols-7 md:grid-cols-14 lg:grid-cols-21 gap-1">
            {episode.dailyBreakdown.map((day, idx) => {
              const isSelected = selectedDay?.dateString === day.dateString;
              const heightPercent = maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDay(isSelected ? null : day);
                    setViewMode('daily');
                  }}
                  className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-cyan-500/20 ring-2 ring-cyan-500' 
                      : day.count > 0 
                        ? 'hover:bg-white/10' 
                        : 'opacity-50'
                  }`}
                  title={`${format(day.date, 'MMM d')}: ${day.count} quakes${day.count > 0 ? `, Peak M${day.peakMagnitude.toFixed(1)}` : ''}`}
                >
                  {/* Bar */}
                  <div className="w-full h-12 flex items-end justify-center">
                    <div
                      className="w-full max-w-[20px] rounded-t transition-all"
                      style={{
                        height: `${Math.max(heightPercent, day.count > 0 ? 10 : 2)}%`,
                        backgroundColor: dailyIntensityColors[day.intensity].dot,
                      }}
                    />
                  </div>
                  {/* Date label */}
                  <span className="text-[9px] text-neutral-500 leading-none">
                    {format(day.date, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-neutral-500">Intensity:</span>
            {(['quiet', 'low', 'moderate', 'high', 'extreme'] as const).map(level => (
              <span key={level} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: dailyIntensityColors[level].dot }}
                />
                <span className={dailyIntensityColors[level].text}>{level}</span>
              </span>
            ))}
          </div>
          
          {/* Selected day info */}
          {selectedDay && (
            <div className={`mt-4 p-3 rounded-lg ${dailyIntensityColors[selectedDay.intensity].bg} border border-white/10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{format(selectedDay.date, 'EEEE, MMMM d, yyyy')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dailyIntensityColors[selectedDay.intensity].bg} ${dailyIntensityColors[selectedDay.intensity].text}`}>
                    {selectedDay.intensity} day
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{selectedDay.count} earthquakes</span>
                  {selectedDay.count > 0 && (
                    <span style={{ color: getMagnitudeColor(selectedDay.peakMagnitude) }}>
                      Peak M{selectedDay.peakMagnitude.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Filters & Search - Datadog Style Toolbar */}
        <div className="bg-neutral-800/30 border-x border-white/10 p-3 flex items-center gap-3 flex-wrap">
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
            {displayEarthquakes.length} {selectedDay ? `on ${format(selectedDay.date, 'MMM d')}` : 'total'} earthquakes
          </span>
          
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear day filter
            </button>
          )}
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
            {displayEarthquakes.map((eq, idx) => (
              <div 
                key={`${eq.id}-${idx}`}
                onClick={() => onEarthquakeClick?.(eq)}
                className={`grid grid-cols-[80px_1fr_100px_80px_80px] gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group ${
                  eq.magnitude >= 3 ? 'bg-white/[0.02]' : ''
                } ${eq.magnitude >= 4 ? 'bg-white/[0.03]' : ''}`}
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
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 flex-shrink-0">
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
                  {formatDepth(eq.depth)}
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
                    <Eye className="w-4 h-4 text-neutral-500 group-hover:text-white" />
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
            
            {displayEarthquakes.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{selectedDay ? 'No earthquakes on this day' : 'No earthquakes match your filters'}</p>
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

// Generate natural language insight about episode patterns
function generateEpisodeInsight(yearlyData: YearlySwarmData[], regionName: string): string {
  const allEpisodes = yearlyData.flatMap(yd => yd.episodes);
  if (allEpisodes.length === 0) {
    return `${regionName} has not experienced any detected swarm episodes in the historical record.`;
  }
  
  const totalEpisodes = allEpisodes.length;
  const yearsWithEpisodes = yearlyData.filter(yd => yd.episodes.length > 0).length;
  const avgPerYear = totalEpisodes / Math.max(yearlyData.length, 1);
  
  const biggestEpisode = allEpisodes.reduce((max, e) => e.totalCount > max.totalCount ? e : max);
  const longestEpisode = allEpisodes.reduce((max, e) => e.durationDays > max.durationDays ? e : max);
  const strongestEpisode = allEpisodes.reduce((max, e) => e.peakMagnitude > max.peakMagnitude ? e : max);
  
  const totalM3Plus = yearlyData.reduce((sum, yd) => sum + yd.magnitudeCounts.m3plus, 0);
  const avgDuration = allEpisodes.reduce((sum, e) => sum + e.durationDays, 0) / totalEpisodes;
  
  const recentYears = yearlyData.slice(0, 3);
  const olderYears = yearlyData.slice(3, 6);
  const recentEpisodes = recentYears.reduce((sum, yd) => sum + yd.episodes.length, 0);
  const olderEpisodes = olderYears.reduce((sum, yd) => sum + yd.episodes.length, 0);
  
  let insight = `${regionName} has experienced ${totalEpisodes} multi-week swarm episodes across ${yearsWithEpisodes} different years`;
  
  insight += `, averaging about ${avgPerYear.toFixed(1)} episodes per year (${avgDuration.toFixed(0)} days average duration). `;
  
  insight += `The largest episode occurred in ${format(biggestEpisode.startTime, 'MMMM yyyy')} with ${biggestEpisode.totalCount} earthquakes over ${biggestEpisode.durationDays} days`;
  
  if (longestEpisode.id !== biggestEpisode.id) {
    insight += `. The longest episode lasted ${longestEpisode.durationDays} days in ${format(longestEpisode.startTime, 'MMMM yyyy')}`;
  }
  
  if (strongestEpisode.id !== biggestEpisode.id) {
    insight += `, while the strongest (M${strongestEpisode.peakMagnitude.toFixed(1)} peak) was in ${format(strongestEpisode.startTime, 'MMMM yyyy')}`;
  }
  
  insight += `. `;
  
  if (totalM3Plus > 0) {
    insight += `There have been ${totalM3Plus} magnitude 3+ earthquakes total across all episodes. `;
  }
  
  // Trend analysis
  if (recentEpisodes > olderEpisodes * 1.5) {
    insight += 'Swarm activity has increased in recent years.';
  } else if (recentEpisodes < olderEpisodes * 0.5) {
    insight += 'Swarm activity has decreased compared to earlier years.';
  } else {
    insight += 'Swarm activity has remained relatively consistent over time.';
  }
  
  return insight;
}
