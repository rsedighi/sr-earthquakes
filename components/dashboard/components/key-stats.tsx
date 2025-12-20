'use client';

import { useMemo, ReactNode } from 'react';
import { 
  Clock, 
  Zap, 
  Activity, 
  Flame, 
  Target, 
  Layers, 
  Sparkles, 
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Users
} from 'lucide-react';
import { Earthquake } from '@/lib/types';
import { getMagnitudeLabel, getMagnitudeColor } from '@/lib/analysis';
import { formatDepth, getDepthDescription } from '@/lib/units';
import { getRegionById } from '@/lib/regions';
import { CollapsibleSection } from '@/components/ui/collapsible-section';

interface KeyStatsProps {
  earthquakes: Earthquake[];
  isLoading: boolean;
  historicalAvgWeekly?: number;
  onFilterByTime?: (hours: number | null) => void;
  onFilterByMagnitude?: (minMag: number) => void;
  onFilterByRegion?: (regionId: string) => void;
  onSelectEarthquake?: (eq: Earthquake) => void;
}

export function KeyStats({ 
  earthquakes, 
  isLoading, 
  historicalAvgWeekly = 30,
  onFilterByTime,
  onFilterByMagnitude,
  onFilterByRegion,
  onSelectEarthquake
}: KeyStatsProps) {
  const stats = useMemo(() => {
    if (!earthquakes.length) return null;
    
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const midWeek = now - 3.5 * 24 * 60 * 60 * 1000;
    
    const last24h = earthquakes.filter(eq => eq.timestamp > oneDayAgo);
    const firstHalf = earthquakes.filter(eq => eq.timestamp < midWeek).length;
    const secondHalf = earthquakes.filter(eq => eq.timestamp >= midWeek).length;
    
    // Trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (firstHalf > 0) {
      const change = (secondHalf - firstHalf) / firstHalf;
      if (change > 0.2) trend = 'increasing';
      else if (change < -0.2) trend = 'decreasing';
    }
    
    // Largest
    const largest = earthquakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max, earthquakes[0]);
    
    // Today's strongest
    const todayQuakes = earthquakes.filter(eq => eq.timestamp > oneDayAgo);
    const strongestToday = todayQuakes.length > 0 
      ? todayQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max, todayQuakes[0])
      : null;
    
    // Average depth
    const avgDepth = earthquakes.reduce((sum, eq) => sum + eq.depth, 0) / earthquakes.length;
    
    // M3+ count
    const m3Plus = earthquakes.filter(eq => eq.magnitude >= 3);
    
    // Felt count
    const feltQuakes = earthquakes.filter(eq => eq.felt && eq.felt > 0);
    
    // Hotspot region
    const regionCounts: Record<string, number> = {};
    for (const eq of earthquakes) {
      regionCounts[eq.region] = (regionCounts[eq.region] || 0) + 1;
    }
    
    let maxRegionId = 'san-ramon';
    let maxCount = 0;
    for (const [regionId, count] of Object.entries(regionCounts)) {
      if (count > maxCount && regionId !== 'unknown') {
        maxCount = count;
        maxRegionId = regionId;
      }
    }
    
    const hotspot = {
      regionId: maxRegionId,
      region: getRegionById(maxRegionId),
      count: maxCount,
      isElevated: maxCount > historicalAvgWeekly * 0.5,
    };
    
    return {
      weekCount: earthquakes.length,
      last24hCount: last24h.length,
      largest,
      strongestToday,
      avgDepth,
      m3Plus,
      feltQuakes,
      hotspot,
      trend,
    };
  }, [earthquakes, historicalAvgWeekly]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-3 w-20 bg-white/[0.06] rounded" />
                <div className="h-8 w-16 bg-white/[0.04] rounded" />
                <div className="h-3 w-24 bg-white/[0.03] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-3">
      {/* Primary stats - always visible, clickable */}
      <div className="grid grid-cols-2 gap-4">
        {/* Last 24h - Click to filter */}
        <ClickableStat
          label="Last 24 Hours"
          value={stats.last24hCount}
          subtext="recent activity"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => onFilterByTime?.(24)}
          active={stats.last24hCount > 5}
          activeLabel="Active"
        />

        {/* Largest magnitude - Click to view */}
        <ClickableStat
          label="Largest"
          value={stats.largest?.magnitude.toFixed(1) || '—'}
          subtext={stats.largest ? getMagnitudeLabel(stats.largest.magnitude) : 'No data'}
          icon={<Zap className="w-4 h-4" />}
          onClick={() => stats.largest && onSelectEarthquake?.(stats.largest)}
          valueColor={stats.largest ? getMagnitudeColor(stats.largest.magnitude) : undefined}
        />
      </div>

      {/* Expandable detailed stats - all clickable */}
      <CollapsibleSection
        title="More Stats"
        badge={6}
        icon={<Activity className="w-4 h-4" />}
        defaultOpen={false}
        className="bg-white/[0.01]"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Week total - Click to show all */}
          <MiniClickableStat
            label="This Week"
            value={stats.weekCount}
            subtext="total earthquakes"
            icon={<Activity className="w-3.5 h-3.5" />}
            onClick={() => onFilterByTime?.(null)}
            trend={stats.trend}
          />

          {/* M3+ Events - Click to filter */}
          <MiniClickableStat
            label="M3+ Events"
            value={stats.m3Plus.length}
            subtext="significant"
            icon={<Target className="w-3.5 h-3.5" />}
            onClick={() => onFilterByMagnitude?.(3)}
            highlight={stats.m3Plus.length >= 3}
          />

          {/* Hotspot - Click to filter by region */}
          <MiniClickableStat
            label="Most Active"
            value={stats.hotspot.count}
            subtext={stats.hotspot.region?.name?.split('/')[0].trim() || 'Region'}
            icon={<Flame className="w-3.5 h-3.5" />}
            onClick={() => onFilterByRegion?.(stats.hotspot.regionId)}
            highlight={stats.hotspot.isElevated}
            accentColor={stats.hotspot.region?.color}
          />

          {/* Average Depth - Informational */}
          <MiniClickableStat
            label="Avg Depth"
            value={formatDepth(stats.avgDepth)}
            subtext={getDepthDescription(stats.avgDepth)}
            icon={<Layers className="w-3.5 h-3.5" />}
          />

          {/* Strongest Today - Click to view */}
          <MiniClickableStat
            label="Today's Max"
            value={stats.strongestToday?.magnitude.toFixed(1) || '—'}
            subtext={stats.strongestToday ? 'click to view' : 'none yet'}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={stats.strongestToday ? () => onSelectEarthquake?.(stats.strongestToday!) : undefined}
          />

          {/* Felt Reports - Click to filter */}
          <MiniClickableStat
            label="Felt Reports"
            value={stats.feltQuakes.length}
            subtext="user reports"
            icon={<Users className="w-3.5 h-3.5" />}
            onClick={stats.feltQuakes.length > 0 ? () => {
              // Could add a felt filter - for now just show first felt quake
              if (stats.feltQuakes[0]) onSelectEarthquake?.(stats.feltQuakes[0]);
            } : undefined}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

// Primary clickable stat card
function ClickableStat({
  label,
  value,
  subtext,
  icon,
  onClick,
  active = false,
  activeLabel,
  valueColor,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  activeLabel?: string;
  valueColor?: string;
}) {
  const isClickable = !!onClick;
  
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`card p-4 sm:p-5 text-left w-full transition-all ${
        isClickable 
          ? 'hover:bg-white/[0.04] hover:border-white/20 cursor-pointer group' 
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-500">
          {icon}
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        {isClickable && (
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        )}
      </div>
      
      <div 
        className="text-3xl sm:text-4xl font-light tabular-nums mt-2"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      
      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
        <span>{subtext}</span>
        {active && activeLabel && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">
            {activeLabel}
          </span>
        )}
      </div>
    </button>
  );
}

// Mini clickable stat card for the collapsible section
function MiniClickableStat({
  label,
  value,
  subtext,
  icon,
  onClick,
  highlight = false,
  trend,
  accentColor,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: ReactNode;
  onClick?: () => void;
  highlight?: boolean;
  trend?: 'increasing' | 'decreasing' | 'stable';
  accentColor?: string;
}) {
  const isClickable = !!onClick;
  
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`p-3 rounded-xl text-left w-full transition-all ${
        highlight ? 'bg-white/[0.04] border border-white/10' : 'bg-white/[0.02] border border-white/[0.04]'
      } ${
        isClickable 
          ? 'hover:bg-white/[0.06] hover:border-white/15 cursor-pointer group' 
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-neutral-500">
          {icon}
          <span className="text-[10px] uppercase tracking-wider truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend && trend !== 'stable' && (
            <span className={trend === 'increasing' ? 'text-emerald-400' : 'text-neutral-400'}>
              {trend === 'increasing' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </span>
          )}
          {isClickable && (
            <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
          )}
        </div>
      </div>
      
      <div 
        className={`text-xl font-light tabular-nums ${highlight ? 'text-white' : ''}`}
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
      
      <div className="text-[10px] text-neutral-600 truncate">{subtext}</div>
    </button>
  );
}
