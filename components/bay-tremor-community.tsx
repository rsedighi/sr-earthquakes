'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Flame,
  Sparkles,
  Plus,
  Search,
  MapPin,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Bell,
  ChevronDown,
  Activity,
  ExternalLink,
  Send,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';
import { getMagnitudeColor } from '@/lib/analysis';
import type { ForumThreadWithId, ForumPostWithId, ForumCategory } from '@/lib/mongodb';

// Sort options
type SortOption = 'hot' | 'new' | 'top';

// Earthquake data from USGS
interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    felt?: number;
    cdi?: number;
    mmi?: number;
    alert?: string;
    type: string;
    title: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

// Community stats
interface CommunityStats {
  totalThreads: number;
  totalPosts: number;
  activeToday: number;
}

export function BayTremorCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumThreadWithId[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('hot');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Load posts
  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const sortParam = sortBy === 'hot' ? 'popular' : sortBy === 'new' ? 'latest' : 'popular';
      const [postsRes, statsRes] = await Promise.all([
        fetch(`/api/forum/threads?sortBy=${sortParam}&limit=25`),
        fetch('/api/forum/threads?stats=true'),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.threads || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="min-h-screen">
      {/* Subreddit Banner */}
      <div className="relative h-24 sm:h-32 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>
        {/* Seismic wave pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Activity className="w-96 h-96 text-black" strokeWidth={0.5} />
        </div>
      </div>

      {/* Community Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 border-4 border-[#0a0a0a] flex items-center justify-center shadow-2xl">
            <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <div className="pb-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">r/baytremor</h1>
              <button className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-200 transition-colors">
                Join
              </button>
            </div>
            <p className="text-neutral-400 text-sm mt-1">Bay Area Earthquake Community</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Feed */}
          <div className="flex-1 space-y-4">
            {/* Create Post Card */}
            <div 
              className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-3 flex items-center gap-3 cursor-pointer hover:border-neutral-700 transition-colors"
              onClick={() => setShowCreatePost(true)}
            >
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="flex-1 px-4 py-2.5 bg-neutral-800/50 rounded-md text-neutral-500 text-sm border border-neutral-700 hover:border-neutral-600 transition-colors">
                Share your earthquake experience
              </div>
              <button className="p-2 hover:bg-neutral-800 rounded transition-colors">
                <ImageIcon className="w-5 h-5 text-neutral-500" />
              </button>
              <button className="p-2 hover:bg-neutral-800 rounded transition-colors">
                <Link2 className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Sort Tabs */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-2 flex items-center gap-1">
              {[
                { id: 'hot' as SortOption, label: 'Hot', icon: Flame },
                { id: 'new' as SortOption, label: 'New', icon: Sparkles },
                { id: 'top' as SortOption, label: 'Top', icon: TrendingUp },
              ].map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      sortBy === option.id
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Posts Feed */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : posts.length === 0 ? (
              <EmptyFeed onCreatePost={() => setShowCreatePost(true)} />
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 space-y-4">
            {/* About Community */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 overflow-hidden">
              <div className="h-10 bg-gradient-to-r from-orange-600 to-amber-500" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-white">About Community</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  Share your earthquake experiences, discuss seismic activity, and connect with Bay Area neighbors. Did you feel it? Let us know!
                </p>

                {stats && (
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-800">
                    <div>
                      <div className="text-lg font-bold text-white">{stats.totalPosts.toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">Posts</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {stats.activeToday}
                      </div>
                      <div className="text-xs text-neutral-500">Online</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:from-orange-400 hover:to-amber-400 transition-all"
                >
                  Create Post
                </button>
              </div>
            </div>

            {/* Community Rules */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                r/baytremor Rules
              </h3>
              <div className="space-y-3">
                {[
                  'Be respectful to fellow Bay Area residents',
                  'Share real experiences only',
                  'Include location when reporting felt quakes',
                  'No misinformation or fear-mongering',
                  'Use proper flair for your posts',
                ].map((rule, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-orange-500 font-medium">{i + 1}.</span>
                    <span className="text-neutral-400">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Useful Links */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-4">
              <h3 className="font-semibold text-white mb-3">Useful Links</h3>
              <div className="space-y-2">
                <a 
                  href="https://earthquake.usgs.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-orange-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  USGS Earthquake Data
                </a>
                <a 
                  href="https://www.ready.gov/earthquakes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-orange-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Earthquake Preparedness
                </a>
                <Link 
                  href="/learn"
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-orange-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn About Earthquakes
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-neutral-600 px-2">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/about" className="hover:text-neutral-400">About</Link>
                <span>·</span>
                <Link href="/faq" className="hover:text-neutral-400">FAQ</Link>
                <span>·</span>
                <Link href="/" className="hover:text-neutral-400">Live Map</Link>
              </div>
              <div className="mt-2">
                Bay Tremor © {new Date().getFullYear()}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} onSuccess={loadPosts} />
      )}
    </div>
  );
}

// Post Card Component
function PostCard({ post }: { post: ForumThreadWithId }) {
  const [votes, setVotes] = useState(post.viewCount || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = (direction: 'up' | 'down') => {
    if (userVote === direction) {
      // Undo vote
      setUserVote(null);
      setVotes(prev => direction === 'up' ? prev - 1 : prev + 1);
    } else {
      // New vote or change vote
      const change = userVote ? 2 : 1;
      setVotes(prev => direction === 'up' ? prev + change : prev - change);
      setUserVote(direction);
    }
  };

  // Get flair based on category
  const getFlair = () => {
    const flairs: Record<ForumCategory, { label: string; color: string }> = {
      earthquake: { label: '🌋 Felt Report', color: 'bg-amber-500/20 text-amber-400' },
      general: { label: '💬 Discussion', color: 'bg-blue-500/20 text-blue-400' },
      neighborhood: { label: '📍 Local', color: 'bg-green-500/20 text-green-400' },
      preparedness: { label: '🛡️ Safety', color: 'bg-red-500/20 text-red-400' },
      science: { label: '🔬 Science', color: 'bg-purple-500/20 text-purple-400' },
    };
    return flairs[post.category] || flairs.general;
  };

  const flair = getFlair();

  return (
    <Link
      href={`/community/${post.category}/${post.slug}`}
      className="bg-[#1a1a1b] rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors flex overflow-hidden group"
    >
      {/* Vote Column */}
      <div className="w-10 sm:w-12 bg-neutral-900/50 flex flex-col items-center py-3 gap-1">
        <button
          onClick={(e) => { e.preventDefault(); handleVote('up'); }}
          className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
            userVote === 'up' ? 'text-orange-500' : 'text-neutral-500 hover:text-orange-500'
          }`}
        >
          <ArrowBigUp className={`w-5 h-5 sm:w-6 sm:h-6 ${userVote === 'up' ? 'fill-current' : ''}`} />
        </button>
        <span className={`text-xs sm:text-sm font-bold ${
          userVote === 'up' ? 'text-orange-500' : userVote === 'down' ? 'text-blue-500' : 'text-neutral-400'
        }`}>
          {votes}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); handleVote('down'); }}
          className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
            userVote === 'down' ? 'text-blue-500' : 'text-neutral-500 hover:text-blue-500'
          }`}
        >
          <ArrowBigDown className={`w-5 h-5 sm:w-6 sm:h-6 ${userVote === 'down' ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4">
        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2 flex-wrap">
          {post.earthquakeData && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: getMagnitudeColor(post.earthquakeData.magnitude) + '20',
                color: getMagnitudeColor(post.earthquakeData.magnitude)
              }}
            >
              M{post.earthquakeData.magnitude.toFixed(1)}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs ${flair.color}`}>
            {flair.label}
          </span>
          <span>Posted by u/{post.author}</span>
          {post.authorLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {post.authorLocation}
            </span>
          )}
          <span>•</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-medium text-white group-hover:text-orange-500 transition-colors mb-2 line-clamp-2">
          {post.title}
        </h2>

        {/* Earthquake Info Banner */}
        {post.earthquakeData && (
          <div 
            className="p-3 rounded-lg mb-3 flex items-center gap-3"
            style={{ 
              backgroundColor: getMagnitudeColor(post.earthquakeData.magnitude) + '10',
              borderLeft: `3px solid ${getMagnitudeColor(post.earthquakeData.magnitude)}`
            }}
          >
            <Activity className="w-5 h-5" style={{ color: getMagnitudeColor(post.earthquakeData.magnitude) }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{post.earthquakeData.place}</div>
              <div className="text-xs text-neutral-500">
                Magnitude {post.earthquakeData.magnitude.toFixed(1)} • Depth {post.earthquakeData.depth?.toFixed(1) || '?'}km
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-4 text-neutral-500">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-medium">{post.postCount - 1} Comments</span>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); navigator.share?.({ url: `/community/${post.category}/${post.slug}`, title: post.title }); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Share</span>
          </button>
          <button 
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Save</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

// Empty Feed State
function EmptyFeed({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-12 text-center">
      <Activity className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
      <p className="text-neutral-500 mb-6">Be the first to share your earthquake experience!</p>
      <button
        onClick={onCreatePost}
        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:from-orange-400 hover:to-amber-400 transition-all"
      >
        Create Post
      </button>
    </div>
  );
}

// Earthquake Picker Component
function EarthquakePicker({ 
  selectedEarthquake, 
  onSelect 
}: { 
  selectedEarthquake: EarthquakeFeature | null; 
  onSelect: (eq: EarthquakeFeature | null) => void;
}) {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(15); // Initial items to show
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = node;
        // Load more when user scrolls near bottom (within 100px)
        if (scrollHeight - scrollTop - clientHeight < 100) {
          setDisplayCount(prev => prev + 15);
        }
      };
      node.addEventListener('scroll', handleScroll);
      return () => node.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Fetch recent earthquakes
  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchEarthquakes() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/earthquakes?feed=all_week');
        if (res.ok) {
          const data = await res.json();
          // Sort by most recent first
          const sorted = (data.features || []).sort(
            (a: EarthquakeFeature, b: EarthquakeFeature) => 
              b.properties.time - a.properties.time
          );
          setEarthquakes(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch earthquakes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEarthquakes();
  }, [isOpen]);

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(15);
  }, [searchQuery]);

  // Filter earthquakes by search query
  const filteredEarthquakes = earthquakes.filter(eq => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      eq.properties.place?.toLowerCase().includes(query) ||
      eq.properties.mag.toString().includes(query)
    );
  });

  // Get only the earthquakes to display (for infinite scroll)
  const displayedEarthquakes = filteredEarthquakes.slice(0, displayCount);
  const hasMore = filteredEarthquakes.length > displayCount;

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (selectedEarthquake) {
    return (
      <div className="p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: getMagnitudeColor(selectedEarthquake.properties.mag) + '33' }}
            >
              <span style={{ color: getMagnitudeColor(selectedEarthquake.properties.mag) }}>
                {selectedEarthquake.properties.mag.toFixed(1)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {selectedEarthquake.properties.place || 'Unknown location'}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {formatTime(selectedEarthquake.properties.time)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-1.5 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            // Reset state when opening
            setSearchQuery('');
            setDisplayCount(15);
          }
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-left hover:border-orange-500/50 transition-colors"
      >
        <Activity className="w-5 h-5 text-orange-500" />
        <span className="flex-1 text-neutral-400">Link to an earthquake event...</span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1b] border border-neutral-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-neutral-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search earthquakes..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div ref={scrollContainerRef} className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              </div>
            ) : filteredEarthquakes.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                {searchQuery ? 'No earthquakes found' : 'No recent earthquakes'}
              </div>
            ) : (
              <div className="p-1">
                {displayedEarthquakes.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => {
                      onSelect(eq);
                      setIsOpen(false);
                      setSearchQuery('');
                      setDisplayCount(15); // Reset for next time
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ backgroundColor: getMagnitudeColor(eq.properties.mag) + '33' }}
                    >
                      <span style={{ color: getMagnitudeColor(eq.properties.mag) }}>
                        {eq.properties.mag.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {eq.properties.place || 'Unknown location'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {formatTime(eq.properties.time)}
                      </p>
                    </div>
                    {eq.properties.felt && eq.properties.felt > 0 && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full shrink-0">
                        {eq.properties.felt} felt it
                      </span>
                    )}
                  </button>
                ))}
                {/* Load more indicator */}
                {hasMore && (
                  <div className="flex items-center justify-center py-3 text-neutral-500 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scroll for more...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
                setDisplayCount(15);
              }}
              className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Post Modal
function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const router = useRouter();
  const [postType, setPostType] = useState<'text' | 'felt'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<ForumCategory>('earthquake');
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeFeature | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build request body with optional earthquake data
      const requestBody: Record<string, unknown> = {
        title: title.trim(),
        category,
        author: author.trim(),
        authorLocation: location.trim() || undefined,
        content: content.trim(),
      };

      // Add earthquake data if linked
      if (selectedEarthquake) {
        requestBody.earthquakeId = selectedEarthquake.id;
        requestBody.earthquakeData = {
          magnitude: selectedEarthquake.properties.mag,
          place: selectedEarthquake.properties.place || 'Unknown location',
          time: new Date(selectedEarthquake.properties.time).toISOString(),
        };
      }

      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      const data = await res.json();
      onSuccess();
      onClose();
      router.push(`/community/${category}/${data.thread.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1b] rounded-lg border border-neutral-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Create a post</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Post Type Tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => setPostType('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              postType === 'text' 
                ? 'text-white border-b-2 border-orange-500' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Post
          </button>
          <button
            onClick={() => { setPostType('felt'); setCategory('earthquake'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              postType === 'felt' 
                ? 'text-white border-b-2 border-orange-500' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Did You Feel It?
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category Select */}
          {postType === 'text' && (
            <div className="space-y-4">
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ForumCategory);
                    // Clear selected earthquake if changing away from earthquake category
                    if (e.target.value !== 'earthquake') {
                      setSelectedEarthquake(null);
                    }
                  }}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-orange-500"
                >
                  <option value="general">💬 General Discussion</option>
                  <option value="earthquake">🌋 Earthquake Report</option>
                  <option value="neighborhood">📍 Neighborhood</option>
                  <option value="preparedness">🛡️ Preparedness & Safety</option>
                  <option value="science">🔬 Science & Research</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
              
              {/* Show earthquake picker when category is earthquake */}
              {category === 'earthquake' && (
                <EarthquakePicker 
                  selectedEarthquake={selectedEarthquake}
                  onSelect={setSelectedEarthquake}
                />
              )}
            </div>
          )}

          {postType === 'felt' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-amber-400">Report an earthquake you felt</span>
                </div>
                <p className="text-sm text-neutral-400">
                  Share your experience to help others understand the impact in your area.
                </p>
              </div>
              
              {/* Earthquake Picker */}
              <EarthquakePicker 
                selectedEarthquake={selectedEarthquake}
                onSelect={setSelectedEarthquake}
              />
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={postType === 'felt' ? "e.g., Just felt a strong shake in Downtown SF!" : "Title"}
            maxLength={200}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
            required
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={postType === 'felt' 
              ? "Describe what you experienced - how strong was the shaking? What were you doing? Any damage?"
              : "Text (optional)"
            }
            rows={6}
            maxLength={10000}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
            required
          />

          {/* Author Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
              required
            />
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g., San Jose)"
                maxLength={50}
                className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Felt Intensity (for earthquake reports) */}
          {postType === 'felt' && (
            <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <label className="block text-sm font-medium text-neutral-300 mb-3">How strong did it feel?</label>
              <div className="flex gap-2">
                {[
                  { level: 1, label: 'Weak', color: 'green' },
                  { level: 2, label: 'Light', color: 'lime' },
                  { level: 3, label: 'Moderate', color: 'yellow' },
                  { level: 4, label: 'Strong', color: 'orange' },
                  { level: 5, label: 'Severe', color: 'red' },
                ].map(({ level, label, color }) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${
                      intensity === level
                        ? `bg-${color}-500/20 border-${color}-500/50 text-${color}-400`
                        : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:bg-neutral-700'
                    }`}
                    style={intensity === level ? {
                      backgroundColor: `var(--${color}, #f59e0b)20`,
                      borderColor: `var(--${color}, #f59e0b)50`,
                      color: `var(--${color}, #f59e0b)`,
                    } : {}}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-2 px-1">
                <span>Weak</span>
                <span>Severe</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !author.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Thread Detail View Component
export function ThreadDetailView({ slug, category }: { slug: string; category: ForumCategory }) {
  const router = useRouter();
  const [thread, setThread] = useState<ForumThreadWithId | null>(null);
  const [posts, setPosts] = useState<ForumPostWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply form state
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadThread() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/forum/threads/${slug}`);
        if (!res.ok) throw new Error('Thread not found');
        const data = await res.json();
        setThread(data.thread);
        setPosts(data.posts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load thread');
      } finally {
        setIsLoading(false);
      }
    }
    loadThread();
  }, [slug]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !author.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread._id,
          author: author.trim(),
          authorLocation: location.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to post reply');

      const data = await res.json();
      if (data.post) {
        setPosts(prev => [...prev, data.post]);
      }
      setContent('');
      setShowReplyForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-400 mb-4">{error || 'Thread not found'}</p>
          <Link href="/community" className="text-orange-500 hover:underline">
            Back to r/baytremor
          </Link>
        </div>
      </div>
    );
  }

  const getFlair = () => {
    const flairs: Record<ForumCategory, { label: string; color: string }> = {
      earthquake: { label: '🌋 Felt Report', color: 'bg-amber-500/20 text-amber-400' },
      general: { label: '💬 Discussion', color: 'bg-blue-500/20 text-blue-400' },
      neighborhood: { label: '📍 Local', color: 'bg-green-500/20 text-green-400' },
      preparedness: { label: '🛡️ Safety', color: 'bg-red-500/20 text-red-400' },
      science: { label: '🔬 Science', color: 'bg-purple-500/20 text-purple-400' },
    };
    return flairs[thread.category] || flairs.general;
  };

  const flair = getFlair();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Breadcrumb Header */}
      <div className="bg-[#1a1a1b] border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/community" className="flex items-center gap-1.5 text-orange-500 hover:text-orange-400">
              <Activity className="w-4 h-4" />
              r/baytremor
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{thread.category}</span>
          </div>
        </div>
      </div>

      {/* Main Post */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <article className="bg-[#1a1a1b] rounded-lg border border-neutral-800 overflow-hidden">
          {/* Vote + Content Layout */}
          <div className="flex">
            {/* Vote Column */}
            <div className="w-12 bg-neutral-900/50 flex flex-col items-center py-4 gap-1">
              <button className="p-1 text-neutral-500 hover:text-orange-500 transition-colors">
                <ArrowBigUp className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold text-neutral-400">{thread.viewCount}</span>
              <button className="p-1 text-neutral-500 hover:text-blue-500 transition-colors">
                <ArrowBigDown className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs ${flair.color}`}>
                  {flair.label}
                </span>
                <span>Posted by u/{thread.author}</span>
                {thread.authorLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {thread.authorLocation}
                  </span>
                )}
                <span>•</span>
                <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                {thread.title}
              </h1>

              {/* Post Content */}
              {thread.content && (
                <div className="text-neutral-300 text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed mb-4">
                  {thread.content}
                </div>
              )}

              {/* Earthquake Info */}
              {thread.earthquakeData && (
                <div 
                  className="p-4 rounded-lg mb-4 flex items-center gap-4"
                  style={{ 
                    backgroundColor: getMagnitudeColor(thread.earthquakeData.magnitude) + '10',
                    borderLeft: `4px solid ${getMagnitudeColor(thread.earthquakeData.magnitude)}`
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold"
                    style={{ 
                      backgroundColor: getMagnitudeColor(thread.earthquakeData.magnitude) + '20',
                      color: getMagnitudeColor(thread.earthquakeData.magnitude)
                    }}
                  >
                    {thread.earthquakeData.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{thread.earthquakeData.place}</div>
                    <div className="text-sm text-neutral-500">
                      Depth: {thread.earthquakeData.depth?.toFixed(1) || '?'} km
                    </div>
                  </div>
                  <Link
                    href={`/earthquake/${thread.earthquakeId}`}
                    className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center gap-2 mt-4 text-neutral-500 border-t border-neutral-800 pt-4">
                <button 
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-neutral-800 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">{posts.filter(p => !p.isOriginalPost).length} Comments</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-neutral-800 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-neutral-800 transition-colors">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-sm font-medium">Save</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Reply Form */}
        {showReplyForm && !thread.isLocked && (
          <div className="mt-4 bg-[#1a1a1b] rounded-lg border border-neutral-800 p-4">
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="text-sm text-neutral-400 mb-2">
                Comment as...
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                  required
                />
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="w-full pl-11 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What are your thoughts?"
                rows={4}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !author.trim() || !content.trim()}
                  className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Comment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Comment Button */}
        {!showReplyForm && !thread.isLocked && (
          <button
            onClick={() => setShowReplyForm(true)}
            className="mt-4 w-full p-4 bg-[#1a1a1b] rounded-lg border border-neutral-800 text-neutral-500 text-left hover:border-neutral-700 transition-colors"
          >
            What are your thoughts?
          </button>
        )}

        {/* Comments - filter out the original post since its content is shown above */}
        <div className="mt-4 space-y-2">
          {posts
            .filter(post => !post.isOriginalPost)
            .map((post, index) => (
              <CommentCard key={post._id} post={post} isOP={false} index={index} />
            ))}
        </div>

        {posts.filter(p => !p.isOriginalPost).length === 0 && (
          <div className="mt-8 text-center py-12">
            <MessageSquare className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500">No comments yet</p>
            <p className="text-neutral-600 text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Comment Card
function CommentCard({ post, isOP, index }: { post: ForumPostWithId; isOP: boolean; index: number }) {
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  return (
    <div className={`bg-[#1a1a1b] rounded-lg border ${isOP ? 'border-orange-500/30' : 'border-neutral-800'} p-4`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isOP ? 'bg-orange-500/20' : 'bg-neutral-800'
        }`}>
          <Users className={`w-4 h-4 ${isOP ? 'text-orange-500' : 'text-neutral-500'}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-medium text-white">u/{post.author}</span>
            {isOP && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded">
                OP
              </span>
            )}
            {post.authorLocation && (
              <span className="text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.authorLocation}
              </span>
            )}
            {post.feltIt && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Felt it {post.intensity && `(${post.intensity}/5)`}
              </span>
            )}
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <div className="mt-2 text-neutral-300 text-sm whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 text-neutral-500">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  if (userVote === 'up') {
                    setUserVote(null);
                    setVotes(v => v - 1);
                  } else {
                    setVotes(v => v + (userVote === 'down' ? 2 : 1));
                    setUserVote('up');
                  }
                }}
                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${userVote === 'up' ? 'text-orange-500' : ''}`}
              >
                <ArrowBigUp className={`w-4 h-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
              </button>
              <span className={`text-xs font-bold ${userVote === 'up' ? 'text-orange-500' : userVote === 'down' ? 'text-blue-500' : ''}`}>
                {votes}
              </span>
              <button 
                onClick={() => {
                  if (userVote === 'down') {
                    setUserVote(null);
                    setVotes(v => v + 1);
                  } else {
                    setVotes(v => v - (userVote === 'up' ? 2 : 1));
                    setUserVote('down');
                  }
                }}
                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${userVote === 'down' ? 'text-blue-500' : ''}`}
              >
                <ArrowBigDown className={`w-4 h-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
              </button>
            </div>
            <button className="flex items-center gap-1 text-xs hover:text-white transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              Reply
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-white transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Widget for other pages
export function CommunityWidget() {
  const [posts, setPosts] = useState<ForumThreadWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forum/threads?trending=true&limit=3')
      .then(res => res.json())
      .then(data => setPosts(data.threads || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || posts.length === 0) return null;

  return (
    <section className="bg-[#1a1a1b] rounded-lg border border-neutral-800 overflow-hidden">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-white">r/baytremor</h3>
        </div>
        <Link href="/community" className="text-xs text-orange-500 hover:text-orange-400">
          View All
        </Link>
      </div>
      <div className="divide-y divide-neutral-800">
        {posts.map((post, i) => (
          <Link
            key={post._id}
            href={`/community/${post.category}/${post.slug}`}
            className="flex items-center gap-3 p-3 hover:bg-neutral-800/50 transition-colors"
          >
            <span className="text-lg font-bold text-neutral-600">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white line-clamp-1">{post.title}</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {post.postCount - 1} comments • {formatDistanceToNow(new Date(post.lastPostAt), { addSuffix: true })}
              </div>
            </div>
            {post.earthquakeData && (
              <span 
                className="text-sm font-bold"
                style={{ color: getMagnitudeColor(post.earthquakeData.magnitude) }}
              >
                M{post.earthquakeData.magnitude.toFixed(1)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
