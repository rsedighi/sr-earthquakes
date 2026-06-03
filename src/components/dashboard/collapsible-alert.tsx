'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Activity,
  Info,
  Sparkles,
  ChevronDown,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

import type { HotspotRegion } from './types';
import { parseAiSummary } from './utils';

export function CollapsibleAlert({
  hotspotRegion,
  aiSummary,
  isLoadingAiSummary,
}: {
  hotspotRegion: HotspotRegion;
  aiSummary: string | null;
  isLoadingAiSummary: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const severityColor = hotspotRegion.multiplier >= 5 
    ? 'red' 
    : hotspotRegion.multiplier >= 3 
      ? 'orange' 
      : 'yellow';
  
  const parsedSummary = useMemo(() => parseAiSummary(aiSummary || ''), [aiSummary]);
  
  return (
    <div className={`rounded-xl border overflow-hidden ${
      severityColor === 'red' 
        ? 'border-red-500/40 bg-red-500/5' 
        : severityColor === 'orange' 
          ? 'border-orange-500/40 bg-orange-500/5' 
          : 'border-yellow-500/40 bg-yellow-500/5'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
          severityColor === 'red' ? 'text-red-400' : severityColor === 'orange' ? 'text-orange-400' : 'text-yellow-400'
        }`} />
        <span className={`font-medium text-xs sm:text-sm truncate ${
          severityColor === 'red' ? 'text-red-300' : severityColor === 'orange' ? 'text-orange-300' : 'text-yellow-300'
        }`}>
          Elevated Seismic Activity
        </span>
        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 text-neutral-400 flex-shrink-0">
          {hotspotRegion.multiplier.toFixed(0)}× typical
        </span>
        <div className="flex-1" />
        <span className="text-xs text-neutral-500 hidden sm:inline">
          {isExpanded ? 'Hide' : 'Details'}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
            {isLoadingAiSummary ? (
              <div className="space-y-3 animate-pulse">
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-amber-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-blue-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-5/6 bg-white/10 rounded" />
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-neutral-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-1/2 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ) : parsedSummary ? (
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  severityColor === 'red' 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : severityColor === 'orange' 
                      ? 'bg-orange-500/10 border-orange-500/20' 
                      : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <Activity className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    severityColor === 'red' ? 'text-red-400' : severityColor === 'orange' ? 'text-orange-400' : 'text-amber-400'
                  }`} />
                  <p className={`text-sm leading-relaxed font-medium ${
                    severityColor === 'red' ? 'text-red-100' : severityColor === 'orange' ? 'text-orange-100' : 'text-amber-100'
                  }`}>
                    {parsedSummary.headline}
                  </p>
                </div>
                
                {parsedSummary.details && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/15">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-100/90 leading-relaxed">
                      {parsedSummary.details}
                    </p>
                  </div>
                )}
                
                {parsedSummary.context && (
                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                    <Sparkles className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-300/90 leading-relaxed">
                      {parsedSummary.context}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  severityColor === 'red' 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : severityColor === 'orange' 
                      ? 'bg-orange-500/10 border-orange-500/20' 
                      : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <Activity className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    severityColor === 'red' ? 'text-red-400' : severityColor === 'orange' ? 'text-orange-400' : 'text-amber-400'
                  }`} />
                  <p className={`text-sm leading-relaxed ${
                    severityColor === 'red' ? 'text-red-100' : severityColor === 'orange' ? 'text-orange-100' : 'text-amber-100'
                  }`}>
                    {hotspotRegion.region?.name || 'The Bay Area'} is experiencing {hotspotRegion.multiplier.toFixed(1)}× the typical earthquake rate with {hotspotRegion.count} earthquakes this week.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <Info className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-300/90 leading-relaxed">
                    This type of elevated activity is common along the {hotspotRegion.region?.faultLine || 'local fault system'}. Similar patterns have occurred many times in the past 15 years without producing damaging earthquakes.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-2">
              <Link prefetch={false} 
                href="/history"
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  severityColor === 'red' 
                    ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' 
                    : severityColor === 'orange' 
                      ? 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20' 
                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Historical Analysis
              </Link>
              <Link prefetch={false} 
                href="/learn"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-neutral-300 hover:bg-white/10 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                Learn About Swarms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
