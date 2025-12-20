'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  ChevronRight,
  ChevronLeft,
  User,
  Flame,
  Eye,
  Pin,
  Lock,
  Search,
  Plus,
  ArrowLeft,
  Hash,
  Home,
  Mountain,
  Shield,
  Lightbulb,
  Activity,
  RefreshCw,
  AlertCircle,
  X,
  CornerDownRight,
  Globe,
  Filter,
} from 'lucide-react';
import { getPusherClient, PUSHER_EVENTS } from '@/lib/pusher';
import { getMagnitudeColor } from '@/lib/analysis';
import type { ForumCategory, ForumThreadWithId, ForumPostWithId } from '@/lib/mongodb';

// Props for Forum component
interface ForumProps {
  initialCategory?: ForumCategory;
  initialThread?: string;
}

// Category configuration
const CATEGORIES: { id: ForumCategory; name: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'earthquake', name: 'Earthquake Discussions', description: 'Talk about recent and historical earthquakes', icon: Activity, color: 'amber' },
  { id: 'general', name: 'General Discussion', description: 'Anything earthquake or Bay Area related', icon: MessageCircle, color: 'blue' },
  { id: 'neighborhood', name: 'Neighborhoods', description: 'Local discussions by area', icon: Home, color: 'green' },
  { id: 'preparedness', name: 'Preparedness & Safety', description: 'Tips, kits, and emergency planning', icon: Shield, color: 'red' },
  { id: 'science', name: 'Science & Research', description: 'Seismology, geology, and research', icon: Lightbulb, color: 'purple' },
];

// Valid category IDs for validation
const VALID_CATEGORIES: ForumCategory[] = ['earthquake', 'general', 'neighborhood', 'preparedness', 'science'];

// Color classes helper
const getCategoryColorClasses = (color: string) => ({
  cardGradient: {
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50',
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 hover:border-green-500/50',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/30 hover:border-red-500/50',
    purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50',
  }[color] || 'from-neutral-500/20 to-neutral-500/10 border-neutral-500/30',
  iconColor: {
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  }[color] || 'text-neutral-400',
});

type ViewMode = 'categories' | 'threads' | 'thread' | 'create';

interface ForumState {
  view: ViewMode;
  category: ForumCategory | null;
  threadSlug: string | null;
  earthquakeId?: string;
}

// Build clean URL for forum state
const buildForumUrl = (state: ForumState): string => {
  if (state.view === 'thread' && state.category && state.threadSlug) {
    return `/community/${state.category}/${state.threadSlug}`;
  }
  
  if (state.view === 'threads' && state.category) {
    return `/community/${state.category}`;
  }
  
  if (state.view === 'create' && state.category) {
    return `/community/${state.category}?action=create`;
  }
  
  return '/community';
};

// Derive forum state from props
const deriveForumState = (initialCategory?: ForumCategory, initialThread?: string): ForumState => {
  if (initialThread && initialCategory) {
    return { view: 'thread', category: initialCategory, threadSlug: initialThread };
  }
  
  if (initialCategory) {
    return { view: 'threads', category: initialCategory, threadSlug: null };
  }
  
  return { view: 'categories', category: null, threadSlug: null };
};

export function Forum({ initialCategory, initialThread }: ForumProps = {}) {
  const router = useRouter();
  
  // State for create mode (handled locally since it's a modal-like interaction)
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  // Derive base state from props (URL determines the view)
  const state = isCreateMode && initialCategory
    ? { view: 'create' as ViewMode, category: initialCategory, threadSlug: null }
    : deriveForumState(initialCategory, initialThread);

  // Navigate to a new state (uses router.push with clean URLs)
  const navigateTo = useCallback((newState: Partial<ForumState>) => {
    const nextState = { ...state, ...newState };
    
    // Handle create mode locally
    if (nextState.view === 'create') {
      setIsCreateMode(true);
      return;
    }
    
    setIsCreateMode(false);
    
    // Build clean URL and navigate
    const url = buildForumUrl(nextState);
    router.push(url, { scroll: false });
  }, [state, router]);

  // Go back using browser history
  const goBack = useCallback(() => {
    if (isCreateMode) {
      setIsCreateMode(false);
      return;
    }
    router.back();
  }, [router, isCreateMode]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/community"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            state.view === 'categories' 
              ? 'bg-white/10 text-white' 
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4" />
          Forum
        </Link>
        {state.category && (
          <>
            <ChevronRight className="w-4 h-4 text-neutral-600" />
            <Link
              href={`/community/${state.category}`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                state.view === 'threads' 
                  ? 'bg-white/10 text-white' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {CATEGORIES.find(c => c.id === state.category)?.name || state.category}
            </Link>
          </>
        )}
        {state.threadSlug && (
          <>
            <ChevronRight className="w-4 h-4 text-neutral-600" />
            <span className="text-white truncate max-w-[200px]">Thread</span>
          </>
        )}
      </nav>

      {/* Main Content */}
      {state.view === 'categories' && (
        <CategoriesView />
      )}
      {state.view === 'threads' && state.category && (
        <ThreadsListView 
          category={state.category} 
          onCreateThread={() => setIsCreateMode(true)}
        />
      )}
      {state.view === 'thread' && state.threadSlug && state.category && (
        <ThreadView 
          slug={state.threadSlug}
          category={state.category}
        />
      )}
      {state.view === 'create' && state.category && (
        <CreateThreadView 
          category={state.category}
          onCancel={() => setIsCreateMode(false)}
          onSuccess={(slug) => router.push(`/community/${state.category}/${slug}`)}
        />
      )}
    </div>
  );
}

// Categories View
function CategoriesView() {
  const [stats, setStats] = useState<{ totalThreads: number; totalPosts: number; activeToday: number } | null>(null);
  const [trending, setTrending] = useState<ForumThreadWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, trendingRes] = await Promise.all([
          fetch('/api/forum/threads?stats=true'),
          fetch('/api/forum/threads?trending=true&limit=5'),
        ]);
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }
        if (trendingRes.ok) {
          const data = await trendingRes.json();
          setTrending(data.threads || []);
        }
      } catch (err) {
        console.error('Failed to load forum data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/20 border border-indigo-500/20 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="forum-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="1" height="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#forum-grid)" />
          </svg>
        </div>
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Community Forum</h1>
              <p className="text-neutral-300 text-base">
                Join discussions about earthquakes, share experiences, and connect with your Bay Area neighbors.
              </p>
            </div>
            {stats && (
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.totalThreads}</div>
                  <div className="text-xs text-neutral-400">Threads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
                  <div className="text-xs text-neutral-400">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{stats.activeToday}</div>
                  <div className="text-xs text-neutral-400">Active Today</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          const colorClasses = {
            amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50',
            blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50',
            green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 hover:border-green-500/50',
            red: 'from-red-500/20 to-rose-500/10 border-red-500/30 hover:border-red-500/50',
            purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50',
          }[category.color];
          
          const iconColors = {
            amber: 'text-amber-400',
            blue: 'text-blue-400',
            green: 'text-green-400',
            red: 'text-red-400',
            purple: 'text-purple-400',
          }[category.color];

          return (
            <Link
              key={category.id}
              href={`/community/${category.id}`}
              className={`relative overflow-hidden p-5 rounded-xl bg-gradient-to-br ${colorClasses} border transition-all hover:scale-[1.02] active:scale-[0.98] text-left group`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-white/10 ${iconColors}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-neutral-400 line-clamp-2">{category.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Trending Threads */}
      {trending.length > 0 && (
        <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-white">Hot Discussions</h2>
          </div>
          <div className="divide-y divide-white/5">
            {trending.map(thread => (
              <ThreadRow key={thread._id} thread={thread} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Recent earthquake type for display
interface RecentEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
}

// Thread List View
function ThreadsListView({ 
  category, 
  onCreateThread,
}: { 
  category: ForumCategory;
  onCreateThread: () => void;
}) {
  const [threads, setThreads] = useState<ForumThreadWithId[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'active'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [recentEarthquakes, setRecentEarthquakes] = useState<RecentEarthquake[]>([]);
  const LIMIT = 15;

  const categoryInfo = CATEGORIES.find(c => c.id === category);
  const Icon = categoryInfo?.icon || MessageCircle;

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        sortBy,
        limit: LIMIT.toString(),
        skip: (page * LIMIT).toString(),
      });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/forum/threads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category, sortBy, page, searchQuery]);

  // Load recent earthquakes for earthquake category
  useEffect(() => {
    if (category === 'earthquake') {
      fetch('/api/earthquakes?feed=all_week')
        .then(res => res.json())
        .then(data => {
          const quakes = (data.earthquakes || [])
            .slice(0, 10)
            .map((q: { id: string; properties: { mag: number; place: string; time: number } }) => ({
              id: q.id,
              magnitude: q.properties?.mag || 0,
              place: q.properties?.place || 'Unknown',
              time: q.properties?.time || Date.now(),
            }));
          setRecentEarthquakes(quakes);
        })
        .catch(console.error);
    }
  }, [category]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/community"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className={`p-3 rounded-xl bg-${categoryInfo?.color}-500/20`}>
            <Icon className={`w-6 h-6 text-${categoryInfo?.color}-400`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{categoryInfo?.name}</h2>
            <p className="text-sm text-neutral-400">{total} threads</p>
          </div>
        </div>
        <button
          onClick={onCreateThread}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-5 h-5" />
          New Thread
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          {(['latest', 'popular', 'active'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => { setSortBy(sort); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${sortBy === sort ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Earthquakes Section - Only for earthquake category */}
      {category === 'earthquake' && recentEarthquakes.length > 0 && page === 0 && !searchQuery && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl border border-amber-500/20 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm text-amber-200">Recent Earthquakes to Discuss</span>
          </div>
          <div className="p-3 grid gap-2 sm:grid-cols-2">
            {recentEarthquakes.slice(0, 6).map(quake => (
              <Link
                key={quake.id}
                href={`/earthquake/${quake.id}#comments`}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all group"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ 
                    backgroundColor: getMagnitudeColor(quake.magnitude) + '20',
                    color: getMagnitudeColor(quake.magnitude)
                  }}
                >
                  {quake.magnitude.toFixed(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{quake.place?.split(',')[0]}</div>
                  <div className="text-xs text-neutral-500">
                    {formatDistanceToNow(new Date(quake.time), { addSuffix: true })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
              </Link>
            ))}
          </div>
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5">
            <p className="text-xs text-neutral-500">Click an earthquake to view details and join the discussion</p>
          </div>
        </div>
      )}

      {/* Thread List */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 font-medium">No threads yet</p>
            <p className="text-neutral-600 text-sm mt-1">Be the first to start a discussion!</p>
            <button
              onClick={onCreateThread}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-400 transition-colors"
            >
              Create Thread
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {threads.map(thread => (
              <ThreadRow 
                key={thread._id} 
                thread={thread} 
                showCategory={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-400 px-4">
            Page {page + 1} of {Math.ceil(total / LIMIT)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * LIMIT >= total}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Thread Row Component
function ThreadRow({ 
  thread, 
  showCategory = true,
}: { 
  thread: ForumThreadWithId;
  showCategory?: boolean;
}) {
  const categoryInfo = CATEGORIES.find(c => c.id === thread.category);
  
  return (
    <Link
      href={`/community/${thread.category}/${thread.slug}`}
      className="block w-full p-4 hover:bg-white/[0.03] transition-colors text-left group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar/Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10">
          {thread.earthquakeData ? (
            <span 
              className="text-sm font-bold"
              style={{ color: getMagnitudeColor(thread.earthquakeData.magnitude) }}
            >
              {thread.earthquakeData.magnitude.toFixed(1)}
            </span>
          ) : (
            <User className="w-5 h-5 text-neutral-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {thread.isPinned && (
              <span className="text-amber-500" title="Pinned">
                <Pin className="w-3.5 h-3.5" />
              </span>
            )}
            {thread.isLocked && (
              <span className="text-red-500" title="Locked">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {thread.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {thread.author}
            </span>
            {thread.authorLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {thread.authorLocation}
              </span>
            )}
            {showCategory && categoryInfo && (
              <span className={`px-2 py-0.5 rounded-full bg-${categoryInfo.color}-500/20 text-${categoryInfo.color}-400`}>
                {categoryInfo.name}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1" title="Replies">
              <MessageCircle className="w-3.5 h-3.5" />
              {thread.postCount - 1}
            </span>
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              {thread.viewCount}
            </span>
          </div>
          <div className="text-xs text-neutral-600">
            {thread.lastPostAuthor && (
              <span className="text-neutral-500">{thread.lastPostAuthor} • </span>
            )}
            {formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true })}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}

// Individual Thread View
function ThreadView({ slug, category }: { slug: string; category: ForumCategory }) {
  const [thread, setThread] = useState<ForumThreadWithId | null>(null);
  const [posts, setPosts] = useState<ForumPostWithId[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [feltIt, setFeltIt] = useState(false);
  const [intensity, setIntensity] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadThread() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/forum/threads/${slug}`);
        if (!res.ok) throw new Error('Thread not found');
        const data = await res.json();
        setThread(data.thread);
        setPosts(data.posts || []);
        setTotalPosts(data.totalPosts || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load thread');
      } finally {
        setIsLoading(false);
      }
    }
    loadThread();

    // Real-time updates
    const pusher = getPusherClient();
    if (pusher) {
      const channel = pusher.subscribe(`forum-thread-${slug}`);
      channel.bind(PUSHER_EVENTS.NEW_COMMENT, (newPost: ForumPostWithId) => {
        setPosts(prev => {
          if (prev.some(p => p._id === newPost._id)) return prev;
          return [...prev, newPost];
        });
        setTotalPosts(prev => prev + 1);
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(`forum-thread-${slug}`);
      };
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !author.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread._id,
          author: author.trim(),
          authorLocation: location.trim() || undefined,
          content: content.trim(),
          feltIt: thread.category === 'earthquake' ? feltIt : undefined,
          intensity: thread.category === 'earthquake' && feltIt ? intensity : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post reply');
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setContent('');
      setFeltIt(false);
      setIntensity(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-neutral-400">{error || 'Thread not found'}</p>
        <Link
          href={`/community/${category}`}
          className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors inline-block"
        >
          Go Back
        </Link>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.id === thread.category);

  return (
    <div className="space-y-6">
      {/* Thread Header */}
      <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <Link
            href={`/community/${thread.category}`}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {categoryInfo?.name}
          </Link>
          
          {/* Earthquake Banner */}
          {thread.earthquakeData && (
            <div 
              className="p-4 rounded-xl mb-4 flex items-center gap-4"
              style={{ 
                backgroundColor: getMagnitudeColor(thread.earthquakeData.magnitude) + '15',
                borderLeft: `4px solid ${getMagnitudeColor(thread.earthquakeData.magnitude)}`
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ 
                  backgroundColor: getMagnitudeColor(thread.earthquakeData.magnitude) + '20',
                  color: getMagnitudeColor(thread.earthquakeData.magnitude)
                }}
              >
                {thread.earthquakeData.magnitude.toFixed(1)}
              </div>
              <div>
                <div className="font-semibold text-white">{thread.earthquakeData.place}</div>
                <div className="text-sm text-neutral-400">
                  {format(new Date(thread.earthquakeData.time), 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
              <Link
                href={`/earthquake/${thread.earthquakeId}`}
                className="ml-auto px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                View Details
              </Link>
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-3">{thread.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {thread.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {format(new Date(thread.createdAt), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {thread.viewCount} views
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {totalPosts} posts
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard key={post._id} post={post} isOP={post.isOriginalPost} index={index} />
        ))}
      </div>

      {/* Reply Form */}
      {!thread.isLocked && (
        <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            Post a Reply
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Location (optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Jose"
                    maxLength={50}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Your Reply *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply..."
                maxLength={5000}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                required
              />
            </div>

            {/* Earthquake-specific options */}
            {thread.category === 'earthquake' && (
              <div className="space-y-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feltIt}
                    onChange={(e) => setFeltIt(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                    feltIt 
                      ? 'bg-amber-500 border-amber-400' 
                      : 'border-neutral-600 bg-white/5'
                  }`}>
                    {feltIt && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`font-medium ${feltIt ? 'text-amber-400' : 'text-neutral-300'}`}>
                    I felt this earthquake
                  </span>
                </label>

                {feltIt && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">How strong did it feel?</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setIntensity(level)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border
                            ${intensity === level
                              ? level <= 2 ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                : level === 3 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                : level === 4 ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                : 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1 px-1">
                      <span>Weak</span>
                      <span>Severe</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !author.trim() || !content.trim()}
                className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
                  submitSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Posted!
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Post Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {thread.isLocked && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">This thread is locked</p>
          <p className="text-neutral-500 text-sm">New replies are not allowed.</p>
        </div>
      )}
    </div>
  );
}

// Post Card Component
function PostCard({ post, isOP, index }: { post: ForumPostWithId; isOP: boolean; index: number }) {
  return (
    <div className={`bg-white/[0.02] rounded-xl border ${isOP ? 'border-blue-500/30' : 'border-white/5'} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${
            isOP 
              ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-blue-500/30' 
              : 'bg-gradient-to-br from-neutral-700 to-neutral-800 border-white/10'
          }`}>
            <User className={`w-6 h-6 ${isOP ? 'text-blue-400' : 'text-neutral-400'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-semibold text-white">{post.author}</span>
              {isOP && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                  OP
                </span>
              )}
              {post.authorLocation && (
                <span className="text-xs text-neutral-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {post.authorLocation}
                </span>
              )}
              {post.feltIt && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  Felt it {post.intensity && `(${post.intensity}/5)`}
                </span>
              )}
            </div>

            <div className="text-neutral-300 whitespace-pre-wrap break-words leading-relaxed">
              {post.content}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              <span className="text-neutral-600">#{index + 1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Thread View
function CreateThreadView({ 
  category, 
  onCancel,
  onSuccess,
}: { 
  category: ForumCategory;
  onCancel: () => void;
  onSuccess: (slug: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryInfo = CATEGORIES.find(c => c.id === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          author: author.trim(),
          authorLocation: location.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create thread');
      }

      const data = await res.json();
      onSuccess(data.thread.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {categoryInfo?.name}
          </button>
          
          <h2 className="text-2xl font-bold text-white">Create New Thread</h2>
          <p className="text-neutral-400 mt-1">Start a new discussion in {categoryInfo?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Thread Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your thread"
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">{title.length}/200 characters</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Your Name *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Location (optional)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco"
                  maxLength={50}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or experiences..."
              maxLength={10000}
              rows={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">{content.length}/10000 characters</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !author.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Thread
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export a compact widget for the dashboard
export function ForumWidget() {
  const [trending, setTrending] = useState<ForumThreadWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await fetch('/api/forum/threads?trending=true&limit=3');
        if (res.ok) {
          const data = await res.json();
          setTrending(data.threads || []);
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
              <h2 className="font-semibold text-white">Forum Discussions</h2>
              <p className="text-xs text-neutral-500">Join the conversation</p>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {trending.map(thread => (
          <div
            key={thread._id}
            className="p-4 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                {thread.earthquakeData ? (
                  <span 
                    className="text-sm font-bold"
                    style={{ color: getMagnitudeColor(thread.earthquakeData.magnitude) }}
                  >
                    {thread.earthquakeData.magnitude.toFixed(1)}
                  </span>
                ) : (
                  <MessageCircle className="w-4 h-4 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white line-clamp-1">{thread.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                  <span>{thread.postCount} posts</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

