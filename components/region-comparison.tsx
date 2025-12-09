'use client';

import { useMemo, useState } from 'react';
import { Earthquake, RegionStats } from '@/lib/types';
import { REGIONS, getRegionById } from '@/lib/regions';
import { getMagnitudeColor, detectSwarms } from '@/lib/analysis';
import { 
  ArrowUp, 
  ArrowDown, 
  Equal, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Zap,
  ChevronDown,
  MapPin
} from 'lucide-react';

interface RegionComparisonProps {
  earthquakes: Earthquake[];
  className?: string;
}

interface ComparisonResult {
  metric: string;
  regionA: { value: number; label: string };
  regionB: { value: number; label: string };
  comparison: 'more' | 'less' | 'equal';
  percentDiff: number;
  insight: string;
}

// Generate narrative comparison between two regions
function generateComparison(
  regionAId: string,
  regionBId: string,
  earthquakes: Earthquake[]
): ComparisonResult[] {
  const regionA = getRegionById(regionAId);
  const regionB = getRegionById(regionBId);
  
  if (!regionA || !regionB) return [];
  
  const quakesA = earthquakes.filter(eq => eq.region === regionAId);
  const quakesB = earthquakes.filter(eq => eq.region === regionBId);
  
  const swarmsA = detectSwarms(quakesA);
  const swarmsB = detectSwarms(quakesB);
  
  const feltA = quakesA.filter(eq => eq.felt && eq.felt > 0);
  const feltB = quakesB.filter(eq => eq.felt && eq.felt > 0);
  
  const maxMagA = quakesA.length > 0 ? Math.max(...quakesA.map(eq => eq.magnitude)) : 0;
  const maxMagB = quakesB.length > 0 ? Math.max(...quakesB.map(eq => eq.magnitude)) : 0;
  
  const getComparison = (a: number, b: number): 'more' | 'less' | 'equal' => {
    const threshold = 0.1; // 10% threshold for "equal"
    const diff = Math.abs(a - b) / Math.max(a, b, 1);
    if (diff < threshold) return 'equal';
    return a > b ? 'more' : 'less';
  };
  
  const getPercentDiff = (a: number, b: number): number => {
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  };
  
  const results: ComparisonResult[] = [
    {
      metric: 'Total Earthquakes',
      regionA: { value: quakesA.length, label: quakesA.length.toLocaleString() },
      regionB: { value: quakesB.length, label: quakesB.length.toLocaleString() },
      comparison: getComparison(quakesA.length, quakesB.length),
      percentDiff: getPercentDiff(quakesA.length, quakesB.length),
      insight: quakesA.length > quakesB.length 
        ? `${regionA.name} has experienced ${getPercentDiff(quakesA.length, quakesB.length)}% more earthquakes`
        : quakesB.length > quakesA.length
          ? `${regionB.name} has experienced ${getPercentDiff(quakesB.length, quakesA.length)}% more earthquakes`
          : `Both regions have similar earthquake counts`,
    },
    {
      metric: 'Swarm Events',
      regionA: { value: swarmsA.length, label: swarmsA.length.toString() },
      regionB: { value: swarmsB.length, label: swarmsB.length.toString() },
      comparison: getComparison(swarmsA.length, swarmsB.length),
      percentDiff: getPercentDiff(swarmsA.length, swarmsB.length),
      insight: swarmsA.length > swarmsB.length 
        ? `${regionA.name} has ${swarmsA.length - swarmsB.length} more swarm events`
        : swarmsB.length > swarmsA.length
          ? `${regionB.name} has ${swarmsB.length - swarmsA.length} more swarm events`
          : `Both regions have similar swarm activity`,
    },
    {
      metric: 'Felt Earthquakes',
      regionA: { value: feltA.length, label: feltA.length.toString() },
      regionB: { value: feltB.length, label: feltB.length.toString() },
      comparison: getComparison(feltA.length, feltB.length),
      percentDiff: getPercentDiff(feltA.length, feltB.length),
      insight: feltA.length > feltB.length 
        ? `People in ${regionA.name} felt ${feltA.length - feltB.length} more earthquakes`
        : feltB.length > feltA.length
          ? `People in ${regionB.name} felt ${feltB.length - feltA.length} more earthquakes`
          : `Similar number of felt earthquakes in both regions`,
    },
    {
      metric: 'Largest Earthquake',
      regionA: { value: maxMagA, label: `M${maxMagA.toFixed(1)}` },
      regionB: { value: maxMagB, label: `M${maxMagB.toFixed(1)}` },
      comparison: getComparison(maxMagA, maxMagB),
      percentDiff: Math.round((maxMagA - maxMagB) * 10),
      insight: maxMagA > maxMagB 
        ? `${regionA.name} recorded a larger maximum earthquake (M${maxMagA.toFixed(1)} vs M${maxMagB.toFixed(1)})`
        : maxMagB > maxMagA
          ? `${regionB.name} recorded a larger maximum earthquake (M${maxMagB.toFixed(1)} vs M${maxMagA.toFixed(1)})`
          : `Both regions have similar maximum magnitudes`,
    },
  ];
  
  return results;
}

// Generate a narrative story
function generateStory(
  regionAId: string,
  regionBId: string,
  earthquakes: Earthquake[]
): string {
  const regionA = getRegionById(regionAId);
  const regionB = getRegionById(regionBId);
  
  if (!regionA || !regionB) return '';
  
  const quakesA = earthquakes.filter(eq => eq.region === regionAId);
  const quakesB = earthquakes.filter(eq => eq.region === regionBId);
  
  const swarmsA = detectSwarms(quakesA);
  const swarmsB = detectSwarms(quakesB);
  
  const feltA = quakesA.filter(eq => eq.felt && eq.felt > 0);
  const feltB = quakesB.filter(eq => eq.felt && eq.felt > 0);
  
  // Determine which region is more active
  const activityRatio = quakesA.length / Math.max(quakesB.length, 1);
  
  if (activityRatio > 1.5) {
    return `${regionA.name} is significantly more seismically active than ${regionB.name}, with ${quakesA.length.toLocaleString()} recorded earthquakes compared to ${quakesB.length.toLocaleString()}. This ${Math.round((activityRatio - 1) * 100)}% difference is likely due to ${regionA.name}'s proximity to the ${regionA.faultLine}. ${swarmsA.length > 0 ? `The region has experienced ${swarmsA.length} earthquake swarm events.` : ''}`;
  } else if (activityRatio < 0.67) {
    return `${regionB.name} experiences more seismic activity than ${regionA.name}, recording ${quakesB.length.toLocaleString()} earthquakes versus ${quakesA.length.toLocaleString()}. This elevated activity is associated with the ${regionB.faultLine}. ${feltB.length > feltA.length ? `Notably, ${feltB.length - feltA.length} more earthquakes were felt by residents in ${regionB.name}.` : ''}`;
  } else {
    return `${regionA.name} and ${regionB.name} show similar levels of seismic activity, with ${quakesA.length.toLocaleString()} and ${quakesB.length.toLocaleString()} earthquakes respectively. Both regions lie along active fault systems — the ${regionA.faultLine} and ${regionB.faultLine}. ${swarmsA.length + swarmsB.length > 0 ? `Together, they've experienced ${swarmsA.length + swarmsB.length} swarm events.` : ''}`;
  }
}

export function RegionComparison({ earthquakes, className = '' }: RegionComparisonProps) {
  const [regionAId, setRegionAId] = useState('san-ramon');
  const [regionBId, setRegionBId] = useState('berkeley-oakland');
  const [showDetails, setShowDetails] = useState(false);
  
  const comparison = useMemo(() => 
    generateComparison(regionAId, regionBId, earthquakes),
    [regionAId, regionBId, earthquakes]
  );
  
  const story = useMemo(() => 
    generateStory(regionAId, regionBId, earthquakes),
    [regionAId, regionBId, earthquakes]
  );
  
  const regionA = getRegionById(regionAId);
  const regionB = getRegionById(regionBId);
  
  const ComparisonIcon = ({ type }: { type: 'more' | 'less' | 'equal' }) => {
    if (type === 'more') return <ArrowUp className="w-4 h-4 text-white" />;
    if (type === 'less') return <ArrowDown className="w-4 h-4 text-neutral-400" />;
    return <Equal className="w-4 h-4 text-neutral-500" />;
  };
  
  return (
    <div className={`card ${className}`}>
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-white" />
          Region Comparison
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          Compare seismic activity between neighborhoods
        </p>
      </div>
      
      {/* Region Selectors */}
      <div className="p-6 border-b border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
          <RegionSelector
            value={regionAId}
            onChange={setRegionAId}
            label="Region A"
            excludeId={regionBId}
          />
          <div className="hidden md:flex items-center justify-center">
            <span className="text-neutral-500 text-sm font-medium">vs</span>
          </div>
          <RegionSelector
            value={regionBId}
            onChange={setRegionBId}
            label="Region B"
            excludeId={regionAId}
          />
        </div>
      </div>
      
      {/* Story Summary */}
      <div className="p-6 bg-white/[0.02] border-b border-white/5">
        <p className="text-neutral-300 leading-relaxed">{story}</p>
      </div>
      
      {/* Quick Stats */}
      <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/5">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-white" />
            <span className="text-sm font-medium">{regionA?.name.split(' / ')[0]}</span>
          </div>
          <div className="text-3xl font-light text-white">
            {earthquakes.filter(eq => eq.region === regionAId).length.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">earthquakes</div>
        </div>
        
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-neutral-500" />
            <span className="text-sm font-medium">{regionB?.name.split(' / ')[0]}</span>
          </div>
          <div className="text-3xl font-light text-white">
            {earthquakes.filter(eq => eq.region === regionBId).length.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">earthquakes</div>
        </div>
      </div>
      
      {/* Detailed Comparison */}
      <div className="p-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-sm text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <span>Detailed comparison</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
        
        {showDetails && (
          <div className="space-y-4 animate-fade-in">
            {comparison.map((item, i) => (
              <div key={i} className="p-4 bg-white/[0.02] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-300">{item.metric}</span>
                  <ComparisonIcon type={item.comparison} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-light text-white">
                      {item.regionA.label}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {regionA?.name.split(' / ')[0]}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    {item.comparison === 'more' && (
                      <span className="text-xs text-white">+{Math.abs(item.percentDiff)}%</span>
                    )}
                    {item.comparison === 'less' && (
                      <span className="text-xs text-neutral-400">-{Math.abs(item.percentDiff)}%</span>
                    )}
                    {item.comparison === 'equal' && (
                      <span className="text-xs text-neutral-500">≈</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-light text-neutral-300">
                      {item.regionB.label}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {regionB?.name.split(' / ')[0]}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-3 text-center">{item.insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Region Selector Component - Area Codes Prominently Displayed
function RegionSelector({ 
  value, 
  onChange, 
  label,
  excludeId 
}: { 
  value: string; 
  onChange: (id: string) => void;
  label: string;
  excludeId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedRegion = getRegionById(value);
  
  return (
    <div className="relative">
      <label className="text-xs text-neutral-500 mb-1 block">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors text-left"
      >
        <span className="px-2.5 py-1 text-sm font-mono font-bold bg-white/15 rounded-lg text-white tracking-wider">
          {selectedRegion?.areaCode}
        </span>
        <span className="flex-1 truncate text-sm">{selectedRegion?.name.split(' / ')[0]}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-80 overflow-y-auto">
          {REGIONS
            .filter(r => r.id !== excludeId)
            .map(region => (
              <button
                key={region.id}
                onClick={() => {
                  onChange(region.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left ${
                  value === region.id ? 'bg-white/10' : ''
                }`}
              >
                <span className={`px-2.5 py-1 text-sm font-mono font-bold rounded-lg tracking-wider flex-shrink-0 ${
                  value === region.id ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-300'
                }`}>
                  {region.areaCode}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{region.name}</div>
                  <div className="text-xs text-neutral-500">{region.county} County • {region.faultLine}</div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// Quick comparison cards for the main view
export function QuickComparison({ 
  earthquakes, 
  regionAId, 
  regionBId 
}: { 
  earthquakes: Earthquake[]; 
  regionAId: string; 
  regionBId: string;
}) {
  const regionA = getRegionById(regionAId);
  const regionB = getRegionById(regionBId);
  
  const countA = earthquakes.filter(eq => eq.region === regionAId).length;
  const countB = earthquakes.filter(eq => eq.region === regionBId).length;
  
  const ratio = countA / Math.max(countB, 1);
  const comparison = ratio > 1.2 ? 'more' : ratio < 0.8 ? 'less' : 'similar';
  
  return (
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: regionA?.color }}
          />
          <div>
            <div className="text-lg font-light">{countA.toLocaleString()}</div>
            <div className="text-xs text-neutral-500">{regionA?.name.split(' / ')[0]}</div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          {comparison === 'more' && <ArrowUp className="w-5 h-5 text-white" />}
          {comparison === 'less' && <ArrowDown className="w-5 h-5 text-neutral-400" />}
          {comparison === 'similar' && <Equal className="w-5 h-5 text-neutral-500" />}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-lg font-light">{countB.toLocaleString()}</div>
            <div className="text-xs text-neutral-500">{regionB?.name.split(' / ')[0]}</div>
          </div>
          <div 
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: regionB?.color }}
          />
        </div>
      </div>
      
      <p className="text-xs text-neutral-500 text-center mt-3">
        {comparison === 'more' && `${regionA?.name.split(' / ')[0]} has ${Math.round((ratio - 1) * 100)}% more earthquakes`}
        {comparison === 'less' && `${regionB?.name.split(' / ')[0]} has ${Math.round((1 / ratio - 1) * 100)}% more earthquakes`}
        {comparison === 'similar' && 'Similar earthquake activity levels'}
      </p>
    </div>
  );
}

