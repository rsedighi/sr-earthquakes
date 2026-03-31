'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  House,
  Map,
  BarChart3,
  Loader2,
  Flame,
  Target,
  Settings,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FileText,
  Globe,
  MessageCircle,
  Menu,
  X,
  History,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

import { Earthquake, SwarmEvent } from '@/lib/types';
import { REGIONS, getRegionById, getLocationContext } from '@/lib/regions';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { useHistoricalEarthquakes } from '@/hooks/use-historical-earthquakes';
import { useMyCity, SELECTABLE_CITIES } from '@/hooks/use-my-city';
import { detectSwarms, getMagnitudeColor, getMagnitudeLabel, getRecentActivity } from '@/lib/analysis';

// Tab types and routes
export type TabId = 'live' | 'community' | 'neighborhood' | 'compare' | 'history' | 'learn';

// Map tab IDs to clean URL paths
const TAB_ROUTES: Record<TabId, string> = {
  live: '/',
  community: '/community',
  neighborhood: '/my-area',
  compare: '/compare',
  history: '/history',
  learn: '/learn',
};

// Forum category type
export type ForumCategory = 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';

// Time filter type (moved from hero-header.tsx during cleanup)
export type TimeFilter = 'hour' | '6hours' | 'today' | 'week' | null;

import { formatDepth, formatDepthDeep, formatRadius, formatDistanceBoth, formatDistance, kmToMiles, getDepthDescription } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
// Dynamically import heavy tab components so they don't bundle into the homepage
const RegionComparison = dynamic(() => import('./region-comparison').then(mod => mod.RegionComparison), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/10 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-1/3" />
        </div>
      </div>
      <div className="flex justify-center my-6"><div className="h-12 bg-white/5 rounded-xl w-64" /></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-[500px] bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-[500px] bg-white/5 rounded-2xl border border-white/10" />
      </div>
    </div>
  )
});
const MyNeighborhood = dynamic(() => import('./my-neighborhood').then(mod => mod.MyNeighborhood), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl border border-white/10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
      </div>
      <div className="h-[400px] bg-white/5 rounded-xl border border-white/5" />
    </div>
  )
});
const HistoricalSwarms = dynamic(() => import('./historical-swarms').then(mod => mod.HistoricalSwarms), { 
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-12 bg-white/5 rounded-xl w-48" />
        <div className="h-12 bg-white/5 rounded-xl w-40" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
      </div>
      <div className="h-96 bg-white/5 rounded-xl border border-white/10 mt-6" />
    </div>
  )
});
import { EarthquakeDetailModal } from './earthquake-detail-modal';
import { BayAreaLogo } from './bay-area-logo';
import { CommunityWidget } from './bay-tremor-community';
import { QuickReportButton } from './community-hub';
import { AffiliateRecommendations, AffiliateShowcase } from './affiliate-recommendations';
import { QuickReportModal } from './quick-report-modal';
import { FeedbackModal } from './feedback-modal';

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(
  () => import('./leaflet-map').then(mod => mod.LeafletMap),
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

// Dynamically import Fault Map to avoid SSR issues  
const FaultMap = dynamic(
  () => import('./fault-map').then(mod => mod.FaultMap),
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
  initialTab?: TabId;
  forumCategory?: ForumCategory;
  forumThread?: string;
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

// Parse AI summary into structured sections
function parseAiSummary(summary: string): { headline: string; details: string; context: string } | null {
  if (!summary) return null;
  
  // Split by sentences (handling multiple punctuation patterns)
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  
  if (sentences.length === 0) return null;
  
  // First sentence is the headline (current situation)
  const headline = sentences[0] || '';
  
  // Middle sentences are details (historical context)
  const details = sentences.slice(1, -1).join(' ');
  
  // Last sentence is context/call-to-action
  const context = sentences.length > 1 ? sentences[sentences.length - 1] : '';
  
  return { headline, details, context };
}

// First-Visit Welcome Prompt - Asks users to set their city
function FirstVisitPrompt({
  onSetCity,
  onDismiss,
}: {
  onSetCity: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <House className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome to Bay Tremor</h2>
            <p className="text-sm text-neutral-400">Stay informed about earthquakes near you</p>
          </div>
        </div>
        
        <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
          Set your city to see <span className="text-blue-400 font-medium">personalized earthquake alerts</span> and 
          distances from your location. You can change this anytime.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSetCity}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Set My City
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-colors"
          >
            Maybe Later
          </button>
        </div>
        
        <p className="text-[10px] text-neutral-500 text-center mt-4">
          Your location is stored locally and never shared.
        </p>
      </div>
    </div>
  );
}

// "Did You Feel That?" Prompt Component - Shows after significant quakes
function FeltItPrompt({
  earthquake,
  onReport,
  onDismiss,
}: {
  earthquake: Earthquake;
  onReport: () => void;
  onDismiss: () => void;
}) {
  const { unitSystem } = useUnits();
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
  // Auto-dismiss after 20 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 20000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up max-w-sm w-full mx-4">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ 
              backgroundColor: getMagnitudeColor(earthquake.magnitude) + '20',
              color: getMagnitudeColor(earthquake.magnitude),
              border: `1px solid ${getMagnitudeColor(earthquake.magnitude)}40`
            }}
          >
            {earthquake.magnitude.toFixed(1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white mb-0.5">
              Did you feel that?
            </div>
            <div className="text-xs text-neutral-300 truncate">
              M{earthquake.magnitude.toFixed(1)} near {locationContext.formattedLocation || earthquake.place?.split(',')[0] || 'Bay Area'}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onReport}
                className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Yes, Report It
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
              >
                No
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// New Earthquake Toast Component - Shows when new quakes are detected
function NewEarthquakeToast({ 
  newQuakes, 
  onDismiss,
  onViewFeed 
}: { 
  newQuakes: Earthquake[];
  onDismiss: () => void;
  onViewFeed: () => void;
}) {
  const { unitSystem } = useUnits();
  
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  if (newQuakes.length === 0) return null;
  
  const largest = newQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max);
  const hasSignificant = largest.magnitude >= 2.5;
  const largestLocationContext = getLocationContext(largest.latitude, largest.longitude, unitSystem);
  
  return (
    <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up ${
      hasSignificant ? 'max-w-sm' : 'max-w-xs'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${
        hasSignificant 
          ? 'bg-amber-500/20 border-amber-500/40' 
          : 'bg-green-500/20 border-green-500/40'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          hasSignificant ? 'bg-amber-400' : 'bg-green-400'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">
            {newQuakes.length === 1 
              ? `New M${largest.magnitude.toFixed(1)} earthquake` 
              : `${newQuakes.length} new earthquakes`
            }
          </div>
          {hasSignificant && (
            <div className="text-xs text-neutral-300 truncate">
              {largestLocationContext.formattedLocation || largest.place?.split(',')[0] || 'Bay Area'}
            </div>
          )}
        </div>
        <button 
          onClick={onViewFeed}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            hasSignificant 
              ? 'bg-amber-500/30 text-amber-200 hover:bg-amber-500/40' 
              : 'bg-green-500/30 text-green-200 hover:bg-green-500/40'
          }`}
        >
          View
        </button>
        <button 
          onClick={onDismiss}
          className="p-1 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Live Timestamp Component - Shows "Updated X seconds ago" with live countdown
function LiveTimestamp({ lastUpdated, isRefreshing }: { lastUpdated: Date | null; isRefreshing: boolean }) {
  const [, forceUpdate] = useState(0);
  
  // Update every second to keep the timestamp fresh
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  if (!lastUpdated) return null;
  
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  
  let timeText: string;
  if (secondsAgo < 5) {
    timeText = 'just now';
  } else if (secondsAgo < 60) {
    timeText = `${secondsAgo}s ago`;
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    timeText = `${minutes}m ago`;
  } else {
    timeText = format(lastUpdated, 'h:mm a');
  }
  
  return (
    <span className="hidden md:flex items-center gap-1.5 text-sm text-neutral-500" suppressHydrationWarning>
      <span className={`transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
        Updated {timeText}
      </span>
      {isRefreshing && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
    </span>
  );
}

// iOS App Promotional Banner - Dismissable, stored in localStorage
function IOSAppBanner() {
  const [isVisible, setIsVisible] = useState(false); // Start hidden to avoid flash, show after mount
  
  useEffect(() => {
    const dismissedAt = localStorage.getItem('baytremor-ios-banner-dismissed-at');
    
    // If never dismissed, show the banner
    if (!dismissedAt) {
      setIsVisible(true);
      return;
    }
    
    // Re-show after 7 days since dismissal
    const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed > 7) {
      setIsVisible(true);
    }
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('baytremor-ios-banner-dismissed-at', Date.now().toString());
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link prefetch={false} 
            href="/ios" 
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group"
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            
            {/* Text content */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-orange-300/90 whitespace-nowrap">
                📱 iOS App Coming Soon
              </span>
              <span className="hidden sm:inline text-xs text-neutral-400">
                — Real-time alerts, widgets & more
              </span>
              <span className="text-xs text-orange-400/80 group-hover:text-orange-300 transition-colors whitespace-nowrap">
                Join waitlist →
              </span>
            </div>
          </Link>
          
          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDismiss();
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors text-neutral-500 hover:text-neutral-300 flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Collapsible Alert Banner - Collapsed by default, with structured AI summary
function CollapsibleAlert({
  hotspotRegion,
  aiSummary,
  isLoadingAiSummary,
}: {
  hotspotRegion: {
    isElevated: boolean;
    multiplier: number;
    count: number;
    region: { name: string; faultLine?: string } | null | undefined;
  };
  aiSummary: string | null;
  isLoadingAiSummary: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const severityColor = hotspotRegion.multiplier >= 5 
    ? 'red' 
    : hotspotRegion.multiplier >= 3 
      ? 'orange' 
      : 'yellow';
  
  // Parse summary into sections
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
      
      {/* Expandable content */}
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
            {isLoadingAiSummary ? (
              // Structured skeleton loader matching final layout
              <div className="space-y-3 animate-pulse">
                {/* Headline skeleton */}
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-amber-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
                
                {/* Details skeleton */}
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-blue-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-5/6 bg-white/10 rounded" />
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                  </div>
                </div>
                
                {/* Context skeleton */}
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <div className="w-5 h-5 rounded bg-neutral-500/20 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-1/2 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ) : parsedSummary ? (
              // Structured summary with visual hierarchy
              <div className="space-y-3">
                {/* Headline - Current Situation (most prominent) */}
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
                
                {/* Details - Historical Context (informative) */}
                {parsedSummary.details && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/15">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-100/90 leading-relaxed">
                      {parsedSummary.details}
                    </p>
                  </div>
                )}
                
                {/* Context - Call to Action (helpful) */}
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
              // Fallback when no AI summary available
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
            
            {/* Quick links */}
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

// Hero Section - Most Recent Notable Earthquake + Set Your City
function HeroQuake({
  earthquakes,
  onViewDetails,
  myCity,
  myCityStats,
  myCityLoaded,
  onSetCity,
}: {
  earthquakes: Earthquake[];
  onViewDetails: (eq: Earthquake) => void;
  myCity: { cityName: string; areaCode?: string } | null;
  myCityStats: { nearbyThisWeek: number; isElevated: boolean } | null;
  myCityLoaded: boolean;
  onSetCity: () => void;
}) {
  const { unitSystem } = useUnits();
  
  // Find most recent M2.0+ earthquake
  const notableQuake = useMemo(() => {
    return earthquakes.find(eq => eq.magnitude >= 2.0) || earthquakes[0];
  }, [earthquakes]);
  
  const locationContext = notableQuake ? getLocationContext(notableQuake.latitude, notableQuake.longitude, unitSystem) : null;
  
  if (!notableQuake) return null;
  
  const isRecent = Date.now() - notableQuake.timestamp < 60 * 60 * 1000; // Within last hour
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Most Recent Notable Earthquake - Full width on mobile, 3/4 on desktop */}
      <button
        onClick={() => onViewDetails(notableQuake)}
        className={`md:col-span-3 card p-4 sm:p-5 text-left group transition-all hover:bg-white/[0.03] ${
          isRecent ? 'ring-1 ring-green-500/30' : ''
        }`}
      >
        {/* Card label - explains what this card shows */}
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3 h-3 text-neutral-500" />
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500 font-medium">
            Latest Notable Quake
          </span>
          {isRecent && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 border border-green-500/30">
              Just now
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Magnitude Badge */}
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ 
              backgroundColor: getMagnitudeColor(notableQuake.magnitude) + '20',
              border: `2px solid ${getMagnitudeColor(notableQuake.magnitude)}50`,
            }}
          >
            <span 
              className="text-xl sm:text-2xl font-light"
              style={{ color: getMagnitudeColor(notableQuake.magnitude) }}
            >
              {notableQuake.magnitude.toFixed(1)}
            </span>
          </div>
          
          {/* Details */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              <span className="text-xs text-neutral-500" suppressHydrationWarning>
                {formatDistanceToNow(notableQuake.time, { addSuffix: true })}
              </span>
              {notableQuake.felt && notableQuake.felt > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">{notableQuake.felt} felt</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white truncate group-hover:text-white/90">
              {locationContext?.formattedLocation || notableQuake.place?.split(',')[0] || 'Bay Area'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 truncate">
              {getMagnitudeLabel(notableQuake.magnitude)} earthquake • {notableQuake.place}
            </p>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0 transition-colors hidden sm:block" />
        </div>
      </button>
      
      {/* Set Your City Widget - Full width on mobile, 1/4 on desktop */}
      <button
        onClick={onSetCity}
        className="md:col-span-1 card p-4 sm:p-5 text-left group transition-all hover:bg-white/[0.03]"
      >
        {myCityLoaded && myCity ? (
          <div className="flex md:flex-col items-center md:items-start gap-3 sm:gap-4 md:gap-2 h-full">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-lg md:text-base font-bold text-white">
                {myCity.areaCode || '—'}
              </span>
            </div>
            <div className="flex-1 min-w-0 md:flex-none">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">{myCity.cityName}</span>
                {myCityStats?.isElevated && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                <span className="text-neutral-300 font-medium tabular-nums">
                  {myCityStats?.nearbyThisWeek || 0}
                </span>{' '}
                nearby
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 md:hidden" />
          </div>
        ) : (
          <div className="flex md:flex-col items-center md:items-center md:justify-center gap-3 sm:gap-4 md:gap-2 h-full md:py-2">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-white/[0.04] border border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
              <House className="w-6 h-6 md:w-5 md:h-5 text-neutral-500" />
            </div>
            <div className="flex-1 min-w-0 md:flex-none md:text-center">
              <div className="font-medium text-white text-sm">Set Your City</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Get personalized alerts
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 md:hidden" />
          </div>
        )}
      </button>
    </div>
  );
}

// Magnitude filter type for earthquake list
type MagnitudeFilter = 'all' | 'm2plus' | 'm3plus' | 'felt';

export function Dashboard({ historicalSummary, initialTab = 'live', forumCategory, forumThread }: DashboardProps) {
  const { unitSystem } = useUnits();
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [detailEarthquake, setDetailEarthquake] = useState<Earthquake | null>(null);
  const [showAllQuakes, setShowAllQuakes] = useState(false);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [magnitudeFilter, setMagnitudeFilter] = useState<MagnitudeFilter>('all');
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [newQuakesToast, setNewQuakesToast] = useState<Earthquake[]>([]);
  const [seenQuakeIds, setSeenQuakeIds] = useState<Set<string>>(new Set());
  const [feltPromptQuake, setFeltPromptQuake] = useState<Earthquake | null>(null);
  const [dismissedFeltPrompts, setDismissedFeltPrompts] = useState<Set<string>>(new Set());
  const [showFirstVisitPrompt, setShowFirstVisitPrompt] = useState(false);
  
  // Tab is controlled by route props
  const activeTab = initialTab;
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

  // Lock body scroll when all quakes modal is open and handle escape key
  useEffect(() => {
    if (showAllQuakes) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowAllQuakes(false);
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showAllQuakes]);

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
    refreshInterval: 10000, // 10 seconds for near-real-time updates
  });
  
  // Detect new earthquakes and show toast
  useEffect(() => {
    if (realtimeQuakes.length === 0 || isLoading) return;
    
    // On first load, just populate the seen IDs without showing toast
    if (seenQuakeIds.size === 0) {
      setSeenQuakeIds(new Set(realtimeQuakes.map(eq => eq.id)));
      return;
    }
    
    // Find new earthquakes (not in our seen set)
    const newQuakes = realtimeQuakes.filter(eq => !seenQuakeIds.has(eq.id));
    
    if (newQuakes.length > 0) {
      // Update seen IDs
      setSeenQuakeIds(prev => {
        const updated = new Set(prev);
        newQuakes.forEach(eq => updated.add(eq.id));
        return updated;
      });
      
      // Show toast for new earthquakes
      setNewQuakesToast(newQuakes);
      
      // Check for significant quakes (M2.5+) to show "Did you feel it?" prompt
      const significantQuake = newQuakes.find(eq => 
        eq.magnitude >= 2.5 && 
        !dismissedFeltPrompts.has(eq.id)
      );
      
      if (significantQuake && !feltPromptQuake) {
        // Delay the prompt slightly so user notices the quake first
        setTimeout(() => {
          setFeltPromptQuake(significantQuake);
        }, 2000);
      }
    }
  }, [realtimeQuakes, isLoading, seenQuakeIds, dismissedFeltPrompts, feltPromptQuake]);

  // Check if this is a first visit (show city prompt after short delay)
  // Coordinates with WhatsNewNotification to avoid overlapping modals
  useEffect(() => {
    // Only check on client side and on live tab
    if (typeof window === 'undefined' || initialTab !== 'live') return;
    
    const hasSeenPrompt = localStorage.getItem('baytremor-seen-welcome');
    const hasCitySet = localStorage.getItem('baytremor-my-city');
    
    // Check if What's New notification might be showing
    const whatsNewDismissed = localStorage.getItem('baytremor-whats-new-dismissed-v3');
    const whatsNewLaunchDate = new Date('2026-02-03');
    const whatsNewExpires = new Date(whatsNewLaunchDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const isWhatsNewActive = !whatsNewDismissed && new Date() < whatsNewExpires;
    
    // Show prompt if: never seen it AND no city set AND data has loaded
    if (!hasSeenPrompt && !hasCitySet && !isLoading) {
      // If What's New is active, wait for it to be dismissed by polling
      if (isWhatsNewActive) {
        const pollInterval = setInterval(() => {
          if (localStorage.getItem('baytremor-whats-new-dismissed-v3')) {
            clearInterval(pollInterval);
            // What's New was just dismissed, show city prompt after a short delay
            setTimeout(() => setShowFirstVisitPrompt(true), 500);
          }
        }, 500);
        
        return () => clearInterval(pollInterval);
      }
      
      // What's New is not active, show prompt after normal delay
      const timer = setTimeout(() => {
        setShowFirstVisitPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [initialTab, isLoading]);
  
  // Handle first-visit prompt dismiss
  const handleFirstVisitDismiss = useCallback(() => {
    setShowFirstVisitPrompt(false);
    localStorage.setItem('baytremor-seen-welcome', 'true');
  }, []);

  // Recent earthquake data (since Dec 8, 2025) - supplements the historical data
  // Only autoFetch when the user is on a tab that actually needs historical data
  const isHistoricalTab = activeTab === 'neighborhood' || activeTab === 'compare' || activeTab === 'history';
  const {
    earthquakes: recentQuakes,
    isLoading: isLoadingRecent,
  } = useHistoricalEarthquakes({
    minMagnitude: 0.1,
    autoFetch: isHistoricalTab,
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
    if ((activeTab === 'compare' || activeTab === 'history') && !historicalLoaded) {
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
  
  // Filter earthquakes based on time filter
  const filteredQuakes = useMemo(() => {
    if (!timeFilter) return realtimeQuakes;
    
    const now = Date.now();
    switch (timeFilter) {
      case 'hour':
        return realtimeQuakes.filter(eq => eq.timestamp > now - 3600000);
      case '6hours':
        return realtimeQuakes.filter(eq => eq.timestamp > now - 21600000);
      case 'today':
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return realtimeQuakes.filter(eq => eq.timestamp > todayStart.getTime());
      case 'week':
      default:
        return realtimeQuakes;
    }
  }, [realtimeQuakes, timeFilter]);
  
  // Filter earthquakes based on magnitude filter (for the feed list)
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
  
  // Reset displayed items count when filter changes
  useEffect(() => {
    setDisplayedItemsCount(20);
  }, [magnitudeFilter]);
  
  // Handle infinite scroll for earthquake list
  const handleEarthquakeListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Load more when within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setDisplayedItemsCount(prev => Math.min(prev + 20, magnitudeFilteredQuakes.length));
    }
  }, [magnitudeFilteredQuakes.length]);
  
  // Count for filter chips badges
  const filterCounts = useMemo(() => ({
    all: realtimeQuakes.length,
    m2plus: realtimeQuakes.filter(eq => eq.magnitude >= 2.0).length,
    m3plus: realtimeQuakes.filter(eq => eq.magnitude >= 3.0).length,
    felt: realtimeQuakes.filter(eq => eq.felt && eq.felt > 0).length,
  }), [realtimeQuakes]);
  
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <BayAreaLogo variant="seismic-bridge" className="w-9 h-9 sm:w-11 sm:h-11" />
                {hotspotRegion.isElevated && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm sm:text-lg truncate">Bay Area Quake Tracker</h1>
                <p className="text-[10px] sm:text-xs text-neutral-500 truncate">Live earthquake monitoring for the SF Bay Area</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* My Area pill - shows user's city */}
              {myCityLoaded && myCity && (
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-full text-xs transition-colors group"
                  title="Click to change city"
                >
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-300 font-medium max-w-[80px] truncate">{myCity.cityName}</span>
                  {myCityStats?.isElevated && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              )}
              <LiveTimestamp lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
              <button 
                onClick={refresh}
                disabled={isRefreshing}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-all ${
                isRefreshing 
                  ? 'bg-green-500/20 border-green-500/40' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 ${
                  isRefreshing ? 'animate-ping' : 'animate-pulse-gentle'
                }`} />
                <span className="text-white text-xs sm:text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* iOS App Promo Banner */}
      <IOSAppBanner />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-6 space-y-3 sm:space-y-4">
        
        {activeTab === 'live' && (
          <>
            {/* COLLAPSIBLE ALERT BANNER - Collapsed by default */}
            {hotspotRegion.isElevated && (
              <CollapsibleAlert
                hotspotRegion={hotspotRegion}
                aiSummary={aiSummary}
                isLoadingAiSummary={isLoadingAiSummary}
              />
            )}

            {/* HERO SECTION - Most Recent Notable Earthquake */}
            <HeroQuake
              earthquakes={realtimeQuakes}
              onViewDetails={setDetailEarthquake}
              myCity={myCity}
              myCityStats={myCityStats}
              myCityLoaded={myCityLoaded}
              onSetCity={() => setShowCitySelector(true)}
            />

            {/* MAIN CONTENT: Map + Feed Side by Side (Feed first on mobile for better UX) */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Map - Takes 3/5 on large screens, appears second on mobile */}
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
                  onSelectEarthquake={setSelectedEarthquake}
                  className="min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]"
                  initialRegion={hotspotRegion.isElevated ? hotspotRegion.regionId : undefined}
                />
              </section>

              {/* Feed - Takes 2/5 on large screens */}
              <section id="earthquake-feed" className="lg:col-span-2 card p-0 flex flex-col max-h-[400px] sm:max-h-[560px]">
                <div className="p-2.5 sm:p-3 border-b border-white/5 flex-shrink-0">
                  {/* Header row */}
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
                          onClick={() => setShowAllQuakes(true)}
                          className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Magnitude filter chips */}
                  <div className="flex items-center gap-1.5">
                    {([
                      { key: 'all', label: 'All', count: filterCounts.all },
                      { key: 'm2plus', label: 'M2+', count: filterCounts.m2plus },
                      { key: 'm3plus', label: 'M3+', count: filterCounts.m3plus },
                      { key: 'felt', label: 'Felt', count: filterCounts.felt },
                    ] as const).map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => setMagnitudeFilter(key)}
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
                    // Infinite scroll for felt filter
                    <div className="divide-y divide-white/5">
                      {deduplicateEarthquakes(magnitudeFilteredQuakes.slice(0, displayedItemsCount)).map((eq, i) => (
                        <CompactEarthquakeRow 
                          key={eq.id} 
                          earthquake={eq} 
                          isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
                          isSelected={selectedEarthquake?.id === eq.id}
                          onClick={() => {
                            setSelectedEarthquake(eq);
                            setDetailEarthquake(eq);
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
                            setSelectedEarthquake(eq);
                            setDetailEarthquake(eq);
                          }}
                          userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
                        />
                      ))}
                      {magnitudeFilteredQuakes.length > 20 && (
                        <button 
                          onClick={() => setShowAllQuakes(true)}
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

            {/* FELT BY COMMUNITY - Earthquakes with felt reports in the last 72 hours */}
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
                          setSelectedEarthquake(eq);
                          setDetailEarthquake(eq);
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
                            <span className="text-[10px] text-neutral-600">•</span>
                            <span className="text-[10px] text-neutral-500">
                              {format(eq.time, 'MMM d')} at {format(eq.time, 'h:mm a')}
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

            {/* STATS GRID - All 7 stats visible on all screen sizes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {/* This Week */}
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">This Week</span>
                </div>
                <div className="text-xl sm:text-2xl font-light">{realtimeQuakes.length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">earthquakes</div>
              </div>

              {/* In Last 24h */}
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Last 24h</span>
                </div>
                <div className="text-xl sm:text-2xl font-light">{last24Hours.length}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">recent</div>
              </div>

              {/* Largest */}
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

              {/* Hotspot */}
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

              {/* M3+ Events */}
              <div className={`card p-3 sm:p-4 ${m3PlusCount >= 3 ? 'ring-1 ring-white/20' : ''}`}>
                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">M3+</span>
                </div>
                <div className="text-xl sm:text-2xl font-light">{m3PlusCount}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">significant</div>
              </div>

              {/* Avg Depth */}
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 mb-1.5 sm:mb-2">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate">Depth</span>
                </div>
                <div className="text-xl sm:text-2xl font-light">{formatDepth(avgDepth, unitSystem)}</div>
                <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 truncate">{getDepthDescription(avgDepth)}</div>
              </div>

              {/* Strongest Today */}
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
            
            {/* City Selector Modal */}
            {showCitySelector && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in overscroll-contain">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col mx-4">
                  <h3 className="text-lg font-semibold mb-2">Select Your City</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Choose a city to see personalized earthquake stats within {formatRadius(16, unitSystem)} of your area.
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
                        city.county.toLowerCase().includes(citySearch.toLowerCase()) ||
                        city.areaCode.includes(citySearch)
                      )
                      .map(city => (
                        <button
                          key={city.name}
                          onClick={() => {
                            setCityByName(city.name);
                            setShowCitySelector(false);
                            setCitySearch('');
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-left
                            ${myCity?.cityName === city.name 
                              ? 'bg-white/10 border border-white/20' 
                              : 'hover:bg-white/5'}`}
                        >
                          {/* Area Code Badge - Prominent */}
                          <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                            <span className="font-mono text-lg font-bold text-white">{city.areaCode}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{city.name}</div>
                            <div className="text-xs text-neutral-500">{city.county} County</div>
                          </div>
                          {myCity?.cityName === city.name && (
                            <span className="text-xs px-2 py-1 bg-white/20 rounded text-white">Selected</span>
                          )}
                        </button>
                      ))}
                    {availableCities.filter(city => 
                      city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      city.county.toLowerCase().includes(citySearch.toLowerCase()) ||
                      city.areaCode.includes(citySearch)
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

            {/* Active Discussions Widget */}
            <CommunityWidget />

            {/* Affiliate Products - Full Showcase */}
            <AffiliateShowcase />
          </>
        )}

        {/* Community tab is now a standalone page at /community */}

        {activeTab === 'neighborhood' && (
          <MyNeighborhood 
            historicalEarthquakes={allHistoricalQuakes}
            isLoadingHistorical={historicalLoading}
            onRequestHistoricalData={loadHistoricalQuakes}
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
              <div className="space-y-6 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 bg-white/5 rounded-xl w-48" />
                  <div className="h-12 bg-white/5 rounded-xl w-40" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
                </div>
                <div className="h-96 bg-white/5 rounded-xl border border-white/10 mt-6" />
                <div className="text-center mt-4">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Loading historical data...</p>
                </div>
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
        <footer className="border-t border-white/5 mt-12 pt-8 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/" className="text-neutral-500 hover:text-white transition-colors">
                    Live Earthquakes
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/today" className="text-neutral-500 hover:text-white transition-colors">
                    Today&apos;s Activity
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/my-area" className="text-neutral-500 hover:text-white transition-colors">
                    My Area
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/community" className="text-neutral-500 hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/history" className="text-neutral-500 hover:text-white transition-colors">
                    History
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/compare" className="text-neutral-500 hover:text-white transition-colors">
                    Compare Regions
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/learn" className="text-neutral-500 hover:text-white transition-colors">
                    Learn
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Safety & Guides */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Safety & Guides</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/felt-earthquake" className="text-neutral-500 hover:text-white transition-colors">
                    Did You Feel It?
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/earthquake-preparedness" className="text-neutral-500 hover:text-white transition-colors">
                    Preparedness Guide
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/san-andreas-fault" className="text-neutral-500 hover:text-white transition-colors">
                    San Andreas Fault
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/hayward-fault" className="text-neutral-500 hover:text-white transition-colors">
                    Hayward Fault
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/calaveras-fault" className="text-neutral-500 hover:text-white transition-colors">
                    Calaveras Fault
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/faq" className="text-neutral-500 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Historical Events */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Historical Events</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/history/1906-san-francisco" className="text-neutral-500 hover:text-white transition-colors">
                    1906 San Francisco
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/history/1989-loma-prieta" className="text-neutral-500 hover:text-white transition-colors">
                    1989 Loma Prieta
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/history/1868-hayward" className="text-neutral-500 hover:text-white transition-colors">
                    1868 Hayward
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/history/2014-napa" className="text-neutral-500 hover:text-white transition-colors">
                    2014 South Napa
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Regions */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Popular Regions</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/region/san-ramon" className="text-neutral-500 hover:text-white transition-colors">
                    San Ramon / Dublin
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/region/berkeley-oakland" className="text-neutral-500 hover:text-white transition-colors">
                    Berkeley / Oakland
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/region/sf-peninsula" className="text-neutral-500 hover:text-white transition-colors">
                    SF Peninsula
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/region/santa-clara" className="text-neutral-500 hover:text-white transition-colors">
                    Santa Clara / San Jose
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/region/sonoma-napa" className="text-neutral-500 hover:text-white transition-colors">
                    Sonoma / Napa
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Cities */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Popular Cities</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/san-francisco-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">
                    San Francisco Today
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/oakland-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">
                    Oakland Today
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/san-jose-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">
                    San Jose Today
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/city/berkeley" className="text-neutral-500 hover:text-white transition-colors">
                    Berkeley
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/city/fremont" className="text-neutral-500 hover:text-white transition-colors">
                    Fremont
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Resources & About */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link prefetch={false} href="/about" className="text-neutral-500 hover:text-white transition-colors">
                    About Bay Tremor
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://earthquake.usgs.gov/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                  >
                    USGS Data <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.shakealert.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                  >
                    ShakeAlert <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.ready.gov/earthquakes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                  >
                    Emergency Prep <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <Link prefetch={false} href="/feed.xml" className="text-neutral-500 hover:text-white transition-colors">
                    RSS Feed
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/privacy" className="text-neutral-500 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Feedback Call-to-Action */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-white">Help Us Improve Bay Tremor</h4>
                  <p className="text-sm text-neutral-400">Share feedback, ideas, report bugs, or inquire about advertising</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Send Feedback
              </button>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-white/5">
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
            <p className="text-xs text-neutral-700 mt-4">
              © {new Date().getFullYear()} Bay Tremor. Built for the Bay Area community.
            </p>
            <p className="text-[10px] text-neutral-700 mt-3 max-w-lg mx-auto">
              Affiliate Disclosure: Some links on this site are affiliate links. As an Amazon Associate, 
              Bay Tremor earns from qualifying purchases at no extra cost to you. This helps us keep the site free.
            </p>
          </div>
        </footer>
      </main>
      
      {/* Quick Report Floating Button - Only on Live tab */}
      {activeTab === 'live' && (
        <QuickReportButton onClick={() => setShowQuickReport(true)} />
      )}

      {/* First-Visit Welcome Prompt */}
      {showFirstVisitPrompt && !myCity && (
        <FirstVisitPrompt
          onSetCity={() => {
            setShowFirstVisitPrompt(false);
            localStorage.setItem('baytremor-seen-welcome', 'true');
            setShowCitySelector(true);
          }}
          onDismiss={handleFirstVisitDismiss}
        />
      )}

      {/* "Did You Feel That?" Prompt for significant quakes */}
      {feltPromptQuake && (
        <FeltItPrompt
          earthquake={feltPromptQuake}
          onReport={() => {
            setFeltPromptQuake(null);
            setShowQuickReport(true);
          }}
          onDismiss={() => {
            setDismissedFeltPrompts(prev => new Set([...prev, feltPromptQuake.id]));
            setFeltPromptQuake(null);
          }}
        />
      )}

      {/* New Earthquake Toast */}
      {newQuakesToast.length > 0 && !feltPromptQuake && (
        <NewEarthquakeToast
          newQuakes={newQuakesToast}
          onDismiss={() => setNewQuakesToast([])}
          onViewFeed={() => {
            setNewQuakesToast([]);
            // Scroll to feed section
            document.getElementById('earthquake-feed')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* Quick Report Modal */}
      <QuickReportModal
        isOpen={showQuickReport}
        onClose={() => setShowQuickReport(false)}
        earthquakes={realtimeQuakes}
        userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Earthquake Detail Modal */}
      {detailEarthquake && (
        <EarthquakeDetailModal
          earthquake={detailEarthquake}
          onClose={() => setDetailEarthquake(null)}
          breadcrumb="Recent Earthquakes"
          allEarthquakes={allHistoricalQuakes}
        />
      )}

      {/* All Earthquakes Modal */}
      {showAllQuakes && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
          onClick={() => setShowAllQuakes(false)}
        >
          <div 
            className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                {magnitudeFilter === 'felt' ? (
                  <Users className="w-5 h-5 text-amber-400" />
                ) : (
                  <Activity className="w-5 h-5 text-neutral-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {magnitudeFilter === 'felt' ? 'Felt Earthquakes' : 'All Earthquakes'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {magnitudeFilter === 'felt' 
                      ? `${magnitudeFilteredQuakes.length} earthquakes with felt reports`
                      : `${realtimeQuakes.length} earthquakes this week`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllQuakes(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Earthquake List with infinite scroll */}
            <div 
              className="flex-1 overflow-y-auto scrollbar-thin"
              onScroll={handleEarthquakeListScroll}
            >
              <div className="divide-y divide-white/5">
                {deduplicateEarthquakes(
                  magnitudeFilter === 'felt' 
                    ? magnitudeFilteredQuakes.slice(0, displayedItemsCount)
                    : realtimeQuakes
                ).map((eq, i) => (
                  <CompactEarthquakeRow 
                    key={eq.id} 
                    earthquake={eq} 
                    isNew={i === 0 && Date.now() - eq.timestamp < 60 * 60 * 1000}
                    isSelected={selectedEarthquake?.id === eq.id}
                    userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
                    onClick={() => {
                      setSelectedEarthquake(eq);
                      setDetailEarthquake(eq);
                      setShowAllQuakes(false);
                    }}
                  />
                ))}
                {magnitudeFilter === 'felt' && displayedItemsCount < magnitudeFilteredQuakes.length && (
                  <div className="flex items-center justify-center py-4 text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Scroll for more ({magnitudeFilteredQuakes.length - displayedItemsCount} remaining)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <p className="text-xs text-neutral-500 text-center">
                Data from USGS • Updated every 10 seconds
              </p>
            </div>
          </div>
        </div>
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
  const { unitSystem } = useUnits();
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
          
          {/* Drop Cover Hold On - With Official Graphics */}
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-lg">The 3 Steps: Drop, Cover, Hold On</h4>
              <a 
                href="https://www.shakeout.org/dropcoverholdon/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Source: ShakeOut.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* DROP */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 flex items-center justify-center">
                  {/* SVG Illustration for DROP */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-red-400">
                    <circle cx="50" cy="25" r="12" fill="currentColor" opacity="0.9"/>
                    <path d="M50 37 L50 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 55 L35 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 55 L65 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 42 L30 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 42 L70 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    {/* Ground line */}
                    <path d="M20 80 L80 80" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    {/* Arrow pointing down */}
                    <path d="M50 85 L50 95 M45 90 L50 95 L55 90" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <h5 className="font-bold text-red-400 text-xl mb-2">DROP</h5>
                <p className="text-sm text-neutral-400">
                  Get down on your hands and knees. This protects you from falling and lets you crawl to shelter.
                </p>
              </div>
              
              {/* COVER */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-2 border-orange-500/30 flex items-center justify-center">
                  {/* SVG Illustration for COVER */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-orange-400">
                    {/* Table */}
                    <rect x="15" y="35" width="70" height="5" rx="2" fill="currentColor" opacity="0.7"/>
                    <rect x="18" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    <rect x="78" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    {/* Person under table */}
                    <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.9"/>
                    <path d="M50 58 L50 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L42 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L58 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Arms protecting head */}
                    <path d="M50 60 L40 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 60 L60 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Ground */}
                    <path d="M15 80 L85 80" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <h5 className="font-bold text-orange-400 text-xl mb-2">COVER</h5>
                <p className="text-sm text-neutral-400">
                  Get under a sturdy desk or table. Cover your head and neck with your arms if no shelter is nearby.
                </p>
              </div>
              
              {/* HOLD ON */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/30 flex items-center justify-center">
                  {/* SVG Illustration for HOLD ON */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-yellow-400">
                    {/* Table */}
                    <rect x="15" y="35" width="70" height="5" rx="2" fill="currentColor" opacity="0.7"/>
                    <rect x="18" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    <rect x="78" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    {/* Person under table holding leg */}
                    <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.9"/>
                    <path d="M50 58 L50 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L42 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L58 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Arm holding table leg */}
                    <path d="M50 60 L22 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Other arm on head */}
                    <path d="M50 55 L55 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Shake lines */}
                    <path d="M10 30 L15 25 M10 40 L5 35" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                    <path d="M90 30 L85 25 M90 40 L95 35" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                    {/* Ground */}
                    <path d="M15 80 L85 80" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <h5 className="font-bold text-yellow-400 text-xl mb-2">HOLD ON</h5>
                <p className="text-sm text-neutral-400">
                  Stay under cover and hold on until the shaking stops. Be prepared to move with your shelter.
                </p>
              </div>
            </div>
            
            {/* Official Graphics Link */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-neutral-300 mb-3">
                <strong>Download official graphics</strong> for your home, school, or workplace:
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.shakeout.org/dropcoverholdon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  ShakeOut Graphics <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.ready.gov/earthquakes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Ready.gov Guide <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.earthquakecountry.org/dropcoverholdon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Earthquake Country <ExternalLink className="w-3 h-3" />
                </a>
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
      
      {/* Bay Area Fault Lines with Interactive Map */}
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
          
          {/* Interactive Fault Map - Using Leaflet with GeoJSON */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
            <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm text-neutral-400">Interactive Fault Map</span>
              <a 
                href="https://usgs.maps.arcgis.com/apps/webappviewer/index.html?id=5a6038b3a1684561a9b0aadf88412fcf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Official USGS Map <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <FaultMap height="450px" />
          </div>
          
          {/* Fault Details Grid - Last Major M6+ Events */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { 
                name: 'San Andreas Fault', 
                desc: 'The most famous fault in California. Runs 800 miles from the Salton Sea to Cape Mendocino. The 1906 San Francisco earthquake (M7.9) caused over 3,000 deaths.',
                risk: 'Very High',
                lastMajor: { year: 1906, magnitude: 7.9, location: 'San Francisco' },
                color: '#ef4444',
              },
              { 
                name: 'Hayward Fault', 
                desc: 'Runs through the East Bay, directly beneath UC Berkeley, Oakland, and Fremont. Scientists consider it the most dangerous fault in the Bay Area due to urban density.',
                risk: 'Very High',
                lastMajor: { year: 1868, magnitude: 6.8, location: 'Hayward' },
                color: '#f97316',
              },
              { 
                name: 'Calaveras Fault', 
                desc: 'Eastern fault zone running through San Ramon, Dublin, Fremont, and into Silicon Valley. Known for frequent earthquake swarms.',
                risk: 'High',
                lastMajor: { year: 1984, magnitude: 6.2, location: 'Morgan Hill' },
                color: '#eab308',
              },
              { 
                name: 'Rodgers Creek Fault', 
                desc: 'Northern extension of the Hayward Fault, through Sonoma and Napa wine country. Ruptured during the 2014 South Napa earthquake.',
                risk: 'High',
                lastMajor: { year: 2014, magnitude: 6.0, location: 'South Napa' },
                color: '#ec4899',
              },
            ].map(fault => {
              const yearsSince = new Date().getFullYear() - fault.lastMajor.year;
              return (
                <div key={fault.name} className="p-5 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fault.color }} />
                      <h4 className="font-semibold text-neutral-200">{fault.name}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      fault.risk === 'Very High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      fault.risk === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {fault.risk} Risk
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">{fault.desc}</p>
                  
                  {/* Last Major M6+ Event - Highlighted */}
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Last Major Event (M6+)</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-light" style={{ color: fault.color }}>
                        M{fault.lastMajor.magnitude.toFixed(1)}
                      </span>
                      <span className="text-neutral-300">{fault.lastMajor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-neutral-500">{fault.lastMajor.year}</span>
                      <span className="text-neutral-600">•</span>
                      <span className={`font-bold ${
                        yearsSince >= 100 ? 'text-red-400' : 
                        yearsSince >= 50 ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        {yearsSince} years ago
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* USGS Link */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-medium text-neutral-200 mb-1">Explore the Full Interactive Map</h5>
                <p className="text-sm text-neutral-400">View detailed fault traces, slip rates, and earthquake history from USGS.</p>
              </div>
              <a
                href="https://usgs.maps.arcgis.com/apps/webappviewer/index.html?id=5a6038b3a1684561a9b0aadf88412fcf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium text-sm"
              >
                USGS Fault Map <ExternalLink className="w-4 h-4" />
              </a>
            </div>
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
                                <div className="text-2xl font-light text-white">&lt;{formatDistanceBoth(10, unitSystem)}</div>
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
              <House className="w-4 h-4 text-white" />
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

// Compact earthquake row for side-by-side layout
// Haversine distance calculation for user distance (returns km)
function getDistanceKmLocal(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function CompactEarthquakeRow({ 
  earthquake, 
  isNew,
  isSelected,
  onClick,
  userLocation,
}: { 
  earthquake: Earthquake; 
  isNew?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  userLocation?: { lat: number; lon: number } | null;
}) {
  const { unitSystem } = useUnits();
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
  // Calculate distance from user (in km)
  const distanceKm = userLocation 
    ? getDistanceKmLocal(userLocation.lat, userLocation.lon, earthquake.latitude, earthquake.longitude)
    : null;
  
  // Calculate how recent the earthquake is for different highlight levels
  const minutesAgo = (Date.now() - earthquake.timestamp) / (1000 * 60);
  const isVeryRecent = minutesAgo < 5; // Less than 5 minutes
  const isRecent = minutesAgo < 30; // Less than 30 minutes
  
  return (
    <button 
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all relative
        ${isVeryRecent ? 'bg-green-500/10 animate-pulse-subtle' : isNew ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}
        ${isSelected ? 'bg-white/[0.06]' : ''}
        ${isVeryRecent ? 'border-l-2 border-green-500' : ''}`}
      onClick={onClick}
    >
      {/* Magnitude */}
      <div 
        className={`text-lg font-light tabular-nums w-10 text-center flex-shrink-0 ${isVeryRecent ? 'animate-bounce-subtle' : ''}`}
        style={{ color: getMagnitudeColor(earthquake.magnitude) }}
      >
        {earthquake.magnitude.toFixed(1)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate flex items-center gap-2">
          <span>{locationContext.formattedLocation || earthquake.place?.split(',')[0] || 'Bay Area'}</span>
          {isVeryRecent && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse uppercase tracking-wide">
              New
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500 flex items-center gap-2">
          <span suppressHydrationWarning className={isVeryRecent ? 'text-green-400/70' : ''}>
            {formatDistanceToNow(earthquake.time, { addSuffix: true })} · {new Date(earthquake.time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} PST
          </span>
          {distanceKm !== null && (
            <span className="text-blue-400/80 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {formatDistance(distanceKm, unitSystem, 0)}
            </span>
          )}
          {earthquake.felt && earthquake.felt > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Users className="w-3 h-3" />
              <span className="font-medium">{earthquake.felt}</span>
            </span>
          )}
        </div>
      </div>

      {/* Pulsing indicator for very recent */}
      {isVeryRecent && (
        <span className="relative flex-shrink-0">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}
    </button>
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
  const { unitSystem } = useUnits();
  const region = getRegionById(earthquake.region);
  const locationContext = getLocationContext(earthquake.latitude, earthquake.longitude, unitSystem);
  
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
          <span className="hidden sm:inline">{formatDepthDeep(earthquake.depth, unitSystem)}</span>
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
