'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Send, 
  User, 
  MapPin, 
  Loader2,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getPusherClient, getEarthquakeChannel, PUSHER_EVENTS } from '@/lib/pusher';
import type { CommentWithId } from '@/lib/mongodb';

interface CommentThreadProps {
  earthquakeId: string;
  earthquakePlace?: string;
}

export function CommentThread({ earthquakeId, earthquakePlace }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    <div className="border-t border-white/5 mt-4 pt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 text-left hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-neutral-500" />
          <span className="font-medium text-sm">
            {comments.length === 0 ? 'Be the first to comment' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
          </span>
          {feltCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              {feltCount} felt it
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white/[0.02] rounded-xl">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Your Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Anonymous"
                  maxLength={50}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Your Location (optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Ramon, Dublin"
                  maxLength={50}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Your Comment</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Share your experience or thoughts about this ${earthquakePlace ? `earthquake near ${earthquakePlace}` : 'earthquake'}...`}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={feltIt}
                  onChange={(e) => setFeltIt(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50"
                />
                <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  I felt this earthquake
                </span>
              </label>
              
              <button
                type="submit"
                disabled={isSubmitting || !author.trim() || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </button>
            </div>
            
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </form>
          
          {/* Comments List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : topLevelComments.length === 0 ? (
              <p className="text-center text-neutral-500 py-6 text-sm">
                No comments yet. Be the first to share your experience!
              </p>
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
    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author}</span>
            {comment.location && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {comment.location}
              </span>
            )}
            {comment.feltIt && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Heart className="w-3 h-3 fill-current" />
                Felt it
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap break-words">
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

