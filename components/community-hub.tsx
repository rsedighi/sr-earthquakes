'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import {
  MessageCircle,
  Users,
  TrendingUp,
  Send,
  MapPin,
  Loader2,
  CheckCircle2,
  Sparkles,
  Activity,
  Clock,
  ChevronRight,
  User,
  Flame,
  Zap,
  RefreshCw,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { getPusherClient, PUSHER_EVENTS } from '@/lib/pusher';
import type { CommentWithId } from '@/lib/mongodb';
import { getMagnitudeColor } from '@/lib/analysis';

interface TrendingEarthquake {
  earthquakeId: string;
  place: string;
  magnitude: number;
  time: string;
  commentCount: number;
  feltCount: number;
  latestComment?: string;
}

interface CommunityStats {
  totalComments: number;
  totalContributors: number;
  commentsToday: number;
  commentsThisWeek: number;
}

interface CommunityComment extends CommentWithId {
  earthquakePlace?: string;
  earthquakeMagnitude?: number;
  earthquakeTime?: string;
}

export function CommunityHub() {
  const [activeView, setActiveView] = useState<'feed' | 'report'>('feed');
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [trending, setTrending] = useState<TrendingEarthquake[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick report form state
  const [reportAuthor, setReportAuthor] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportIntensity, setReportIntensity] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load community data
  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/community?type=all');
      if (!res.ok) throw new Error('Failed to load community data');
      const data = await res.json();
      
      setComments(data.comments || []);
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
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error loading community data:', err);
      setError('Failed to load community data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up real-time subscription for new comments
    const pusher = getPusherClient();
    if (!pusher) return;

    // Subscribe to a global community channel
    const channel = pusher.subscribe('community-global');
    
    channel.bind(PUSHER_EVENTS.NEW_COMMENT, (newComment: CommunityComment) => {
      setComments(prev => {
        if (prev.some(c => c._id === newComment._id)) return prev;
        return [newComment, ...prev].slice(0, 50); // Keep last 50
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('community-global');
    };
  }, [loadData]);

  // Submit quick report (to most recent earthquake)
  const handleQuickReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportAuthor.trim() || !reportContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the most recent earthquake to attach the report to
      const quakeRes = await fetch('/api/earthquakes?feed=all_week');
      const quakeData = await quakeRes.json();
      const recentQuake = quakeData.earthquakes?.[0];

      if (!recentQuake) {
        throw new Error('No recent earthquakes found');
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earthquakeId: recentQuake.id,
          author: reportAuthor.trim(),
          content: `${reportContent.trim()}\n\n📍 Intensity: ${reportIntensity}/5`,
          location: reportLocation.trim() || undefined,
          feltIt: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveView('feed');
      }, 2000);
      setReportContent('');
      setReportIntensity(3);
      
      // Refresh data
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mx-auto mb-4" />
          <p className="text-neutral-500">Loading community discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary CTA - Did You Feel It? */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-red-900/20 border border-amber-500/20 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="quake-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 10 Q5 0, 10 10 T20 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#quake-pattern)"/>
          </svg>
        </div>
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Did You Feel an Earthquake?</h1>
              <p className="text-neutral-300 text-base">
                Share your experience with the Bay Area community! Your report helps others understand the impact.
              </p>
            </div>
            <button
              onClick={() => setActiveView('report')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:from-amber-400 hover:to-orange-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              Report Now
            </button>
          </div>
        </div>
      </div>

      {/* Trending Earthquakes - Quick Access */}
      {trending.length > 0 && activeView !== 'report' && (
        <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Hot Discussions</span>
            </div>
            <span className="text-xs text-neutral-500">Join the conversation</span>
          </div>
          <div className="flex overflow-x-auto gap-3 p-4 scrollbar-hide">
            {trending.slice(0, 5).map(quake => (
              <Link
                key={quake.earthquakeId}
                href={`/earthquake/${quake.earthquakeId}#comments`}
                className="flex-shrink-0 w-48 p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:border-white/15 hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: getMagnitudeColor(quake.magnitude) + '20',
                      color: getMagnitudeColor(quake.magnitude)
                    }}
                  >
                    {quake.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate font-medium">{quake.place?.split(',')[0]}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {quake.commentCount}
                  </span>
                  <span className="text-amber-500 flex items-center gap-1 group-hover:text-amber-400">
                    Join <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle - Simplified */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          {[
            { id: 'feed', label: 'Live Feed', icon: Activity },
            { id: 'report', label: 'Report Quake', icon: Send, highlight: true },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as typeof activeView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeView === view.id 
                  ? view.highlight 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg' 
                    : 'bg-white text-black shadow-lg' 
                  : view.highlight
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <view.icon className="w-4 h-4" />
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Live Feed View */}
      {activeView === 'feed' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Live Activity
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </h2>
            <span className="text-sm text-neutral-500">{comments.length} recent reports</span>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/5">
              <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 font-medium">No community reports yet</p>
              <p className="text-neutral-600 text-sm mt-1">Be the first to share your earthquake experience!</p>
              <button
                onClick={() => setActiveView('report')}
                className="mt-4 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-neutral-200 transition-colors"
              >
                Submit a Report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <FeedComment key={comment._id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      )}


      {/* Quick Report View */}
      {activeView === 'report' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] rounded-2xl border border-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Did You Feel It?</h2>
                <p className="text-neutral-400 text-sm">Report your earthquake experience</p>
              </div>
            </div>

            <form onSubmit={handleQuickReport} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={reportAuthor}
                    onChange={(e) => setReportAuthor(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Your Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      placeholder="e.g., Downtown San Francisco"
                      maxLength={50}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Intensity Selector */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">How strong did it feel? *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReportIntensity(level)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border
                        ${reportIntensity === level
                          ? level <= 2 ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : level === 3 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : level === 4 ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'}`}
                    >
                      {level === 1 && 'Weak'}
                      {level === 2 && 'Light'}
                      {level === 3 && 'Moderate'}
                      {level === 4 && 'Strong'}
                      {level === 5 && 'Severe'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Describe your experience *</label>
                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="What did you feel? Were you sitting or standing? Did objects move? How long did it last?"
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !reportAuthor.trim() || !reportContent.trim() || !reportLocation.trim()}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-xl transition-all duration-200 ${
                  submitSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Report Submitted!
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Feed Comment Component - Enhanced with full earthquake context
function FeedComment({ comment }: { comment: CommunityComment }) {
  return (
    <Link
      href={`/earthquake/${comment.earthquakeId}#comments`}
      className="block bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all group overflow-hidden"
    >
      {/* Earthquake Context Header */}
      {comment.earthquakeMagnitude && comment.earthquakePlace && (
        <div 
          className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3"
          style={{ backgroundColor: getMagnitudeColor(comment.earthquakeMagnitude) + '08' }}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ 
              backgroundColor: getMagnitudeColor(comment.earthquakeMagnitude) + '20',
              color: getMagnitudeColor(comment.earthquakeMagnitude),
              border: `1px solid ${getMagnitudeColor(comment.earthquakeMagnitude)}30`
            }}
          >
            {comment.earthquakeMagnitude.toFixed(1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{comment.earthquakePlace}</div>
            {comment.earthquakeTime && (
              <div className="text-xs text-neutral-500">
                {format(new Date(comment.earthquakeTime), 'MMM d, yyyy • h:mm a')}
              </div>
            )}
          </div>
          <Activity className="w-4 h-4 text-neutral-600" />
        </div>
      )}
      
      {/* Comment Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
            <User className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-semibold text-sm text-white">{comment.author}</span>
              {comment.location && (
                <span className="text-xs text-neutral-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {comment.location}
                </span>
              )}
              {comment.feltIt && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  Felt it
                </span>
              )}
            </div>
            
            <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">{comment.content}</p>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              <span className="text-xs text-neutral-500 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                <MessageCircle className="w-3 h-3" />
                View discussion
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Trending Card Component
function TrendingCard({ quake, rank }: { quake: TrendingEarthquake; rank: number }) {
  // Safety check for magnitude
  const mag = typeof quake.magnitude === 'number' && !isNaN(quake.magnitude) ? quake.magnitude : 0;
  
  return (
    <Link
      href={`/earthquake/${quake.earthquakeId}`}
      className="block p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
          rank === 1 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' :
          rank === 2 ? 'bg-gradient-to-br from-neutral-400 to-neutral-500 text-white' :
          rank === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
          'bg-white/10 text-neutral-400'
        }`}>
          {rank}
        </div>

        {/* Magnitude */}
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center font-light text-2xl flex-shrink-0"
          style={{ 
            backgroundColor: getMagnitudeColor(mag) + '20',
            color: getMagnitudeColor(mag),
            border: `1px solid ${getMagnitudeColor(mag)}40`
          }}
        >
          {mag.toFixed(1)}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{quake.place}</div>
          <div className="text-sm text-neutral-500 mt-0.5">
            {format(new Date(quake.time), 'MMM d, h:mm a')}
          </div>
          {quake.latestComment && (
            <p className="text-xs text-neutral-400 mt-2 line-clamp-1 italic">"{quake.latestComment}"</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-sm font-medium text-white">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            {quake.commentCount}
          </span>
          {quake.feltCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Sparkles className="w-3 h-3" />
              {quake.feltCount} felt it
            </span>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );
}

// Compact widget for the Live tab
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
              // Navigate to community tab - we'll wire this up
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
          // Extra safety check at render time
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
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-full shadow-2xl shadow-orange-500/30 hover:from-amber-400 hover:to-orange-500 hover:scale-105 transition-all group"
    >
      <Zap className="w-5 h-5 group-hover:animate-pulse" />
      <span>Did You Feel It?</span>
    </button>
  );
}



