'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Send, 
  User, 
  MapPin, 
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getPusherClient, getEarthquakeChannel, PUSHER_EVENTS } from '@/lib/pusher';
import type { CommentWithId } from '@/lib/mongodb';

interface CommentThreadProps {
  earthquakeId: string;
  earthquakePlace?: string; // Kept for backwards compatibility
}

export function CommentThread({ earthquakeId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for prominence
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [feltIt, setFeltIt] = useState(false);
  
  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?earthquakeId=${earthquakeId}`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [earthquakeId]);
  
  // Set up real-time subscription
  useEffect(() => {
    loadComments();
    
    const pusher = getPusherClient();
    if (!pusher) return;
    
    const channel = pusher.subscribe(getEarthquakeChannel(earthquakeId));
    
    channel.bind(PUSHER_EVENTS.NEW_COMMENT, (newComment: CommentWithId) => {
      setComments(prev => {
        // Avoid duplicates
        if (prev.some(c => c._id === newComment._id)) return prev;
        return [newComment, ...prev];
      });
    });
    
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getEarthquakeChannel(earthquakeId));
    };
  }, [earthquakeId, loadComments]);
  
  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earthquakeId,
          author: author.trim(),
          content: content.trim(),
          location: location.trim() || undefined,
          feltIt,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }
      
      // Show success state
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      // Clear form (the new comment will come via Pusher)
      setContent('');
      setFeltIt(false);
      // Keep author and location for convenience
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const topLevelComments = comments.filter(c => !c.parentId);
  const feltCount = comments.filter(c => c.feltIt).length;
  
  return (
    <div className="rounded-xl overflow-hidden">
      {/* Header - More Engaging */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left bg-white/[0.03] hover:bg-white/[0.05] transition-colors rounded-xl border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-amber-400" />
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                {comments.length > 9 ? '9+' : comments.length}
              </span>
            )}
          </div>
          <div>
            <span className="font-semibold text-white block">
              {comments.length === 0 ? 'Be the first to share your experience!' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
            </span>
            <span className="text-xs text-neutral-400">
              {feltCount > 0 ? `${feltCount} ${feltCount === 1 ? 'person' : 'people'} felt this earthquake` : 'Click to add your report'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {feltCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-xs font-medium flex items-center gap-1.5 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              {feltCount} felt it
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-4 animate-fade-in">
          {/* Comment Form - More Prominent */}
          <form onSubmit={handleSubmit} className="p-5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Send className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Add your report</h4>
                <p className="text-xs text-neutral-500">Share what you experienced</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your Location (optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Downtown, Pleasanton"
                    maxLength={50}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your Experience *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you feel? How long did it last? How does this compare to other earthquakes you've experienced?"
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
              />
            </div>
            
            <div className="flex items-center justify-between">
              {/* Stylish "I felt it" checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={feltIt}
                    onChange={(e) => setFeltIt(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                    feltIt 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 shadow-lg shadow-amber-500/30' 
                      : 'border-neutral-600 bg-white/5 group-hover:border-neutral-500'
                  }`}>
                    {feltIt && (
                      <CheckCircle2 className="w-4 h-4 text-white animate-scale-in" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium transition-colors ${feltIt ? 'text-amber-400' : 'text-neutral-300 group-hover:text-white'}`}>
                    I felt this earthquake
                  </span>
                  {feltIt && (
                    <span className="text-xs text-amber-400/70 animate-fade-in">
                      Thanks for reporting!
                    </span>
                  )}
                </div>
              </label>
              
              <button
                type="submit"
                disabled={isSubmitting || !author.trim() || !content.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
                  submitSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Posted!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
          </form>
          
          {/* Comments List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : topLevelComments.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800/50 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-neutral-600" />
                </div>
                <p className="text-neutral-400 text-sm font-medium">No comments yet</p>
                <p className="text-neutral-600 text-xs mt-1">Be the first to share your experience!</p>
              </div>
            ) : (
              topLevelComments.map(comment => (
                <CommentCard key={comment._id} comment={comment} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment }: { comment: CommentWithId }) {
  return (
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10">
          <User className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{comment.author}</span>
            {comment.location && (
              <span className="text-xs text-neutral-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {comment.location}
              </span>
            )}
            {comment.feltIt && (
              <span className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Felt it
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-300 mt-2 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>
          <span className="text-xs text-neutral-500 mt-2 block">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact version for earthquake list
export function CommentCount({ earthquakeId, count }: { earthquakeId: string; count?: number }) {
  if (!count || count === 0) return null;
  
  return (
    <span className="text-xs text-neutral-500 flex items-center gap-1">
      <MessageCircle className="w-3 h-3" />
      {count}
    </span>
  );
}
