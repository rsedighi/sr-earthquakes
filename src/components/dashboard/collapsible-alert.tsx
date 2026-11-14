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
  const alertClasses = severityColor === 'red'
    ? 'border-red-500/40 bg-red-500/5'
    : severityColor === 'orange'
      ? 'border-orange-500/40 bg-orange-500/5'
      : 'border-yellow-500/40 bg-yellow-500/5';
  const textClasses = severityColor === 'red'
    ? 'text-red-300'
    : severityColor === 'orange'
      ? 'text-orange-300'
      : 'text-yellow-300';
  const factClasses = severityColor === 'red'
    ? 'bg-red-500/10 border-red-500/20 text-red-100'
    : severityColor === 'orange'
      ? 'bg-orange-500/10 border-orange-500/20 text-orange-100'
      : 'bg-amber-500/10 border-amber-500/20 text-amber-100';

  return (
    <div className={`rounded-xl border overflow-hidden ${alertClasses}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="elevated-activity-details"
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${textClasses}`} />
        <span className={`font-medium text-xs sm:text-sm truncate ${textClasses}`}>
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

      <div id="elevated-activity-details" className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${factClasses}`}>
              <Activity className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textClasses}`} />
              <div>
                <p className="text-sm leading-relaxed font-medium">
                  {hotspotRegion.region?.name || 'The Bay Area'} has recorded {hotspotRegion.count} earthquakes this week, {hotspotRegion.multiplier.toFixed(1)}× its typical weekly rate.
                </p>
                <p className="text-xs mt-1 opacity-80">Calculated by Bay Tremor from USGS event data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <Info className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300/90 leading-relaxed">
                Elevated activity describes recent event frequency. It does not predict whether a larger earthquake will occur.
              </p>
            </div>

            {isLoadingAiSummary ? (
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5 animate-pulse">
                <div className="h-3 w-32 bg-white/10 rounded mb-3" />
                <div className="h-4 w-full bg-white/10 rounded mb-2" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
            ) : parsedSummary ? (
              <div className="p-3 bg-violet-500/5 rounded-lg border border-violet-500/15">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 mb-2">
                  <Sparkles className="w-4 h-4" />
                  Generated context
                </div>
                <div className="space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <p className="font-medium text-neutral-200">{parsedSummary.headline}</p>
                  {parsedSummary.details && <p>{parsedSummary.details}</p>}
                  {parsedSummary.context && <p>{parsedSummary.context}</p>}
                </div>
                <p className="text-[11px] text-neutral-500 mt-3">Automated explanation for context only. Not a prediction or safety instruction.</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                prefetch={false}
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
              <Link
                prefetch={false}
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
