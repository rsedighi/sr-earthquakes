'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  RefreshCw,
  X,
  Activity,
  Users,
  Loader2,
} from 'lucide-react';

import type { Earthquake } from '@/lib/types';
import { getRegionById } from '@/lib/regions';
import { useRealtimeEarthquakes } from '@/hooks/use-realtime-earthquakes';
import { useHistoricalEarthquakes } from '@/hooks/use-historical-earthquakes';
import { useMyCity } from '@/hooks/use-my-city';
import { detectSwarms } from '@/lib/analysis';
import { formatRadius } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';
import { BayAreaLogo } from '@/components/bay-area-logo';
import { QuickReportButton } from '@/components/community-hub';
import { QuickReportModal } from '@/components/quick-report-modal';
import { FeedbackModal } from '@/components/feedback-modal';
import { EarthquakeDetailModal } from '@/components/earthquake-detail-modal';

import type { DashboardProps, HotspotRegion } from './types';
import { deduplicateEarthquakes } from './utils';
import { CompactEarthquakeRow } from './earthquake-rows';
import { LiveTimestamp, FirstVisitPrompt, FeltItPrompt, NewEarthquakeToast } from './prompts';
import { LiveTab } from './live-tab';
import { HistoryTab } from './history-tab';
import { LearnSection } from './learn-tab';
import { DashboardFooter } from './footer';

const RegionComparison = dynamic(() => import('@/components/region-comparison').then(mod => mod.RegionComparison), { 
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


export function Dashboard({ historicalSummary, initialTab = 'live' }: DashboardProps) {
  const { unitSystem } = useUnits();
  const activeTab = initialTab;

  // --- Shared UI state ---
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [detailEarthquake, setDetailEarthquake] = useState<Earthquake | null>(null);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showAllQuakes, setShowAllQuakes] = useState(false);
  const [showFirstVisitPrompt, setShowFirstVisitPrompt] = useState(false);
  const [newQuakesToast, setNewQuakesToast] = useState<Earthquake[]>([]);
  const [seenQuakeIds, setSeenQuakeIds] = useState<Set<string>>(new Set());
  const [feltPromptQuake, setFeltPromptQuake] = useState<Earthquake | null>(null);
  const [dismissedFeltPrompts, setDismissedFeltPrompts] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState(false);

  // --- Lock body scroll for modals ---
  useEffect(() => {
    if (showCitySelector || showAllQuakes) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowCitySelector(false);
          setShowAllQuakes(false);
        }
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
  }, [showCitySelector, showAllQuakes]);

  // --- Real-time data ---
  const { 
    earthquakes: realtimeQuakes, 
    isLoading, 
    lastUpdated, 
    refresh,
    isRefreshing 
  } = useRealtimeEarthquakes({
    feed: 'all_week',
    refreshInterval: 10000,
  });

  // --- Historical data (lazy) ---
  const [historicalQuakes, setHistoricalQuakes] = useState<Earthquake[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalLoaded, setHistoricalLoaded] = useState(false);

  const isHistoricalTab = activeTab === 'compare' || activeTab === 'history';
  const {
    earthquakes: recentQuakes,
  } = useHistoricalEarthquakes({
    minMagnitude: 0.1,
    autoFetch: isHistoricalTab,
  });

  const { myCity, setCityByName, stats: myCityStats, isLoaded: myCityLoaded, availableCities } = useMyCity(realtimeQuakes);

  const loadHistoricalQuakes = useCallback(async () => {
    if (historicalLoading || historicalLoaded) return;
    setHistoricalLoading(true);
    try {
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

  useEffect(() => {
    if ((activeTab === 'compare' || activeTab === 'history') && !historicalLoaded) {
      loadHistoricalQuakes();
    }
  }, [activeTab, historicalLoaded, loadHistoricalQuakes]);

  const allHistoricalQuakes = useMemo(() => {
    const seenIds = new Set<string>();
    const merged: Earthquake[] = [];
    for (const eq of recentQuakes) {
      if (!seenIds.has(eq.id)) { seenIds.add(eq.id); merged.push(eq); }
    }
    for (const eq of historicalQuakes) {
      if (!seenIds.has(eq.id)) { seenIds.add(eq.id); merged.push(eq); }
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentQuakes, historicalQuakes]);

  // --- Derived metrics ---
  const currentSwarm = useMemo(() => {
    const sanRamonRecent = realtimeQuakes.filter(eq => eq.region === 'san-ramon');
    if (sanRamonRecent.length >= 5) {
      const swarms = detectSwarms(sanRamonRecent);
      return swarms[0] || null;
    }
    return null;
  }, [realtimeQuakes]);

  const largestRecent = realtimeQuakes.length > 0 
    ? realtimeQuakes.reduce((max, eq) => eq.magnitude > max.magnitude ? eq : max)
    : null;

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

  const last24Hours = useMemo(() => {
    const now = Date.now();
    return realtimeQuakes.filter(eq => now - eq.timestamp < 24 * 60 * 60 * 1000);
  }, [realtimeQuakes]);

  const hotspotRegion: HotspotRegion = useMemo(() => {
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

  const realtimeQuakesRef = useRef(realtimeQuakes);
  realtimeQuakesRef.current = realtimeQuakes;

  useEffect(() => {
    if (!hotspotRegion.isElevated) {
      setAiSummary(null);
    }
  }, [hotspotRegion.isElevated]);

  // --- Toast / felt prompt detection ---
  useEffect(() => {
    if (realtimeQuakes.length === 0 || isLoading) return;
    if (seenQuakeIds.size === 0) {
      setSeenQuakeIds(new Set(realtimeQuakes.map(eq => eq.id)));
      return;
    }
    const newQuakes = realtimeQuakes.filter(eq => !seenQuakeIds.has(eq.id));
    if (newQuakes.length > 0) {
      setSeenQuakeIds(prev => {
        const updated = new Set(prev);
        newQuakes.forEach(eq => updated.add(eq.id));
        return updated;
      });
      setNewQuakesToast(newQuakes);
      const significantQuake = newQuakes.find(eq => eq.magnitude >= 2.5 && !dismissedFeltPrompts.has(eq.id));
      if (significantQuake && !feltPromptQuake) {
        setTimeout(() => setFeltPromptQuake(significantQuake), 2000);
      }
    }
  }, [realtimeQuakes, isLoading, seenQuakeIds, dismissedFeltPrompts, feltPromptQuake]);

  // --- First visit prompt ---
  useEffect(() => {
    if (typeof window === 'undefined' || initialTab !== 'live') return;
    const hasSeenPrompt = localStorage.getItem('baytremor-seen-welcome');
    const hasCitySet = localStorage.getItem('baytremor-my-city');
    const whatsNewDismissed = localStorage.getItem('baytremor-whats-new-dismissed-v3');
    const whatsNewLaunchDate = new Date('2026-02-03');
    const whatsNewExpires = new Date(whatsNewLaunchDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const isWhatsNewActive = !whatsNewDismissed && new Date() < whatsNewExpires;
    if (!hasSeenPrompt && !hasCitySet && !isLoading) {
      if (isWhatsNewActive) {
        const pollInterval = setInterval(() => {
          if (localStorage.getItem('baytremor-whats-new-dismissed-v3')) {
            clearInterval(pollInterval);
            setTimeout(() => setShowFirstVisitPrompt(true), 500);
          }
        }, 500);
        return () => clearInterval(pollInterval);
      }
      const timer = setTimeout(() => setShowFirstVisitPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [initialTab, isLoading]);

  const handleFirstVisitDismiss = useCallback(() => {
    setShowFirstVisitPrompt(false);
    localStorage.setItem('baytremor-seen-welcome', 'true');
  }, []);

  // --- AI summary (one attempt per elevated period; null = not tried, '' = failed/unavailable) ---
  useEffect(() => {
    if (!hotspotRegion.isElevated || aiSummary !== null || isLoadingAiSummary) return;

    const fetchAiSummary = async () => {
      setIsLoadingAiSummary(true);
      const quakes = realtimeQuakesRef.current;
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
            recentQuakes: quakes.filter(eq => eq.region === hotspotRegion.regionId).slice(0, 10),
            isSwarm: currentSwarm !== null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiSummary(typeof data.summary === 'string' ? data.summary : '');
        } else {
          setAiSummary('');
        }
      } catch (error) {
        console.error('Failed to fetch AI summary:', error);
        setAiSummary('');
      } finally {
        setIsLoadingAiSummary(false);
      }
    };

    fetchAiSummary();
  }, [
    hotspotRegion.isElevated,
    hotspotRegion.regionId,
    hotspotRegion.count,
    hotspotRegion.multiplier,
    largestRecent?.magnitude,
    currentSwarm,
    aiSummary,
    isLoadingAiSummary,
  ]);

  // ========== RENDER ==========
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-6 space-y-3 sm:space-y-4">
        {activeTab === 'live' && (
          <LiveTab
            realtimeQuakes={realtimeQuakes}
            isLoading={isLoading}
            last24Hours={last24Hours}
            hotspotRegion={hotspotRegion}
            historicalSummary={historicalSummary}
            aiSummary={aiSummary}
            isLoadingAiSummary={isLoadingAiSummary}
            myCity={myCity}
            myCityStats={myCityStats}
            myCityLoaded={myCityLoaded}
            selectedEarthquake={selectedEarthquake}
            onSelectEarthquake={setSelectedEarthquake}
            onViewDetail={setDetailEarthquake}
            onSetCity={() => setShowCitySelector(true)}
            onShowAllQuakes={() => setShowAllQuakes(true)}
            largestRecent={largestRecent}
            m3PlusCount={m3PlusCount}
            avgDepth={avgDepth}
            strongestToday={strongestToday}
          />
        )}

        {activeTab === 'compare' && (
          <RegionComparison earthquakes={allHistoricalQuakes} />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            allHistoricalQuakes={allHistoricalQuakes}
            historicalLoading={historicalLoading}
            historicalLoaded={historicalLoaded}
            historicalSummary={historicalSummary}
          />
        )}

        {activeTab === 'learn' && (
          <LearnSection />
        )}

        <DashboardFooter onShowFeedback={() => setShowFeedbackModal(true)} />
      </main>
      
      {/* Quick Report FAB - Live tab only */}
      {activeTab === 'live' && (
        <QuickReportButton onClick={() => setShowQuickReport(true)} />
      )}

      {/* --- Global Overlays --- */}

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

      {newQuakesToast.length > 0 && !feltPromptQuake && (
        <NewEarthquakeToast
          newQuakes={newQuakesToast}
          onDismiss={() => setNewQuakesToast([])}
          onViewFeed={() => {
            setNewQuakesToast([]);
            document.getElementById('earthquake-feed')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      <QuickReportModal
        isOpen={showQuickReport}
        onClose={() => setShowQuickReport(false)}
        earthquakes={realtimeQuakes}
        userLocation={myCity ? { lat: myCity.lat, lon: myCity.lon } : null}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {detailEarthquake && (
        <EarthquakeDetailModal
          earthquake={detailEarthquake}
          onClose={() => setDetailEarthquake(null)}
          breadcrumb="Recent Earthquakes"
          allEarthquakes={allHistoricalQuakes}
        />
      )}

      {/* City Selector Modal */}
      {showCitySelector && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in overscroll-contain">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col mx-4">
            <h3 className="text-lg font-semibold mb-2">Select Your City</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Choose a city to see personalized earthquake stats within {formatRadius(16, unitSystem)} of your area.
            </p>
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
                <button onClick={() => setCitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">✕</button>
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
                <p className="text-center text-neutral-500 py-8">No cities found matching &quot;{citySearch}&quot;</p>
              )}
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => { setShowCitySelector(false); setCitySearch(''); }}
                className="flex-1 px-4 py-2 bg-white/5 text-neutral-400 rounded-lg hover:bg-white/10 transition-colors"
              >Cancel</button>
              {myCity && (
                <button
                  onClick={() => { setCityByName(''); setShowCitySelector(false); setCitySearch(''); }}
                  className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >Clear</button>
              )}
            </div>
          </div>
        </div>
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
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-neutral-400" />
                <div>
                  <h3 className="text-lg font-semibold">All Earthquakes</h3>
                  <p className="text-sm text-neutral-500">{realtimeQuakes.length} earthquakes this week</p>
                </div>
              </div>
              <button onClick={() => setShowAllQuakes(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="divide-y divide-white/5">
                {deduplicateEarthquakes(realtimeQuakes).map((eq, i) => (
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
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <p className="text-xs text-neutral-500 text-center">Data from USGS • Updated every 10 seconds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
