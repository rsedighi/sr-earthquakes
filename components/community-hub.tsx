'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { getMagnitudeColor } from '@/lib/analysis';
import { Forum } from './forum';

interface TrendingEarthquake {
  earthquakeId: string;
  place: string;
  magnitude: number;
  time: string;
  commentCount: number;
  feltCount: number;
  latestComment?: string;
}

// Main Community Hub - now uses the Forum component
interface CommunityHubProps {
  initialCategory?: 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';
  initialThread?: string;
}

export function CommunityHub({ initialCategory, initialThread }: CommunityHubProps = {}) {
  return <Forum initialCategory={initialCategory} initialThread={initialThread} />;
}

// Compact widget for the Live tab - shows trending earthquake discussions
export function ActiveDiscussionsWidget() {
  const [trending, setTrending] = useState<TrendingEarthquake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await fetch('/api/community?type=trending&limit=3&hours=24');
        if (res.ok) {
          const data = await res.json();
          // Filter out entries with missing required fields
          const validTrending = (data.trending || []).filter(
            (q: TrendingEarthquake) => 
              q && 
              q.earthquakeId && 
              typeof q.magnitude === 'number' && 
              !isNaN(q.magnitude) && 
              q.place
          );
          setTrending(validTrending);
        }
      } catch (err) {
        console.error('Failed to load trending:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrending();
  }, []);

  if (isLoading || trending.length === 0) return null;

  return (
    <section className="card overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
              <MessageCircle className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Active Discussions</h2>
              <p className="text-xs text-neutral-500">Join the conversation</p>
            </div>
          </div>
          <Link 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              // Navigate to community tab
              const event = new CustomEvent('navigate-tab', { detail: 'community' });
              window.dispatchEvent(event);
            }}
            className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {trending.map(quake => {
          if (!quake || typeof quake.magnitude !== 'number') return null;
          const mag = quake.magnitude ?? 0;
          return (
            <Link
              key={quake.earthquakeId}
              href={`/earthquake/${quake.earthquakeId}`}
              className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0"
                style={{ 
                  backgroundColor: getMagnitudeColor(mag) + '15',
                  color: getMagnitudeColor(mag)
                }}
              >
                {mag.toFixed(1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{quake.place}</div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {quake.commentCount} comments
                  </span>
                  {quake.feltCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Sparkles className="w-3 h-3" />
                      {quake.feltCount}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Quick Report Floating Button
export function QuickReportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm sm:text-base font-semibold rounded-full shadow-2xl shadow-orange-500/30 hover:from-amber-400 hover:to-orange-500 hover:scale-105 transition-all group max-w-[calc(100vw-24px)] sm:max-w-none"
    >
      <Zap className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse flex-shrink-0" />
      <span className="truncate">Did You Feel It?</span>
    </button>
  );
}
