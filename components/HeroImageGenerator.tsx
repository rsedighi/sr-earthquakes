'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Activity, Loader2 } from 'lucide-react';

interface ImageContext {
  primaryCity: string;
  timestamp: number;
  regionId?: string;
  magnitude?: number;
  heroImageUrl?: string;
}

interface HeroImageGeneratorProps {
  imageContext?: ImageContext;
  title: string;
  category: 'breaking' | 'swarm-alert' | 'weekly-roundup' | 'monthly-report' | 'analysis';
  slug: string;
  date: Date;
}

// Time-based gradients for loading state
const timeGradients: Record<string, string> = {
  dawn: 'from-orange-400/30 via-pink-500/20 to-purple-600/30',
  morning: 'from-blue-400/30 via-cyan-400/20 to-yellow-300/20',
  midday: 'from-blue-500/30 via-sky-400/20 to-white/10',
  afternoon: 'from-yellow-400/30 via-orange-400/20 to-blue-400/20',
  dusk: 'from-orange-500/40 via-pink-500/30 to-purple-700/40',
  evening: 'from-indigo-600/40 via-purple-600/30 to-pink-500/20',
  night: 'from-slate-900/50 via-indigo-900/40 to-purple-900/30',
};

function getTimeOfDay(timestamp: number): string {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 22) return 'evening';
  return 'night';
}

export default function HeroImageGenerator({ 
  imageContext, 
  title, 
  category,
  slug,
  date 
}: HeroImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timestamp = imageContext?.timestamp || date.getTime();
  const timeOfDay = getTimeOfDay(timestamp);
  const city = imageContext?.primaryCity || 'Bay Area';

  // Auto-fetch/generate image on mount
  useEffect(() => {
    let mounted = true;

    async function fetchOrGenerateImage() {
      try {
        // First, try to fetch existing image
        const fetchRes = await fetch(`/api/blog-images?slug=${encodeURIComponent(slug)}`);
        const fetchData = await fetchRes.json();

        if (fetchData.success && fetchData.image?.imageUrl) {
          if (mounted) {
            setImageUrl(fetchData.image.imageUrl);
            setIsLoading(false);
          }
          return;
        }

        // No existing image - trigger generation
        const generateRes = await fetch('/api/blog-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            category,
            city,
            timestamp,
            magnitude: imageContext?.magnitude,
            regionId: imageContext?.regionId,
          }),
        });

        const generateData = await generateRes.json();

        if (mounted) {
          if (generateData.success && generateData.image?.imageUrl) {
            setImageUrl(generateData.image.imageUrl);
          } else {
            setError(generateData.error || 'Failed to generate image');
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Hero image error:', err);
        if (mounted) {
          setError('Failed to load image');
          setIsLoading(false);
        }
      }
    }

    fetchOrGenerateImage();

    return () => {
      mounted = false;
    };
  }, [slug, category, city, timestamp, imageContext?.magnitude, imageContext?.regionId]);

  // Show loading state with gradient background
  if (isLoading) {
    return (
      <div className={`relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10 bg-gradient-to-br ${timeGradients[timeOfDay]}`}>
        {/* Background pattern */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-5" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-loading-waves" patternUnits="userSpaceOnUse" width="80" height="80">
                <circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="0.3" />
                <circle cx="40" cy="40" r="50" fill="none" stroke="white" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-loading-waves)" />
          </svg>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Loading indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-white/20 animate-pulse" />
          </div>
          <p className="text-white/60 text-sm">Loading image...</p>
        </div>
        
        {/* City info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-xl font-semibold">{city}</span>
            </div>
            {imageContext?.magnitude && imageContext.magnitude >= 3.0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/30 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="font-bold">M{imageContext.magnitude.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error state with gradient fallback (no retry button, just graceful fallback)
  if (error || !imageUrl) {
    return (
      <div className={`relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10 bg-gradient-to-br ${timeGradients[timeOfDay]}`}>
        {/* Background pattern */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-5" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-error-waves" patternUnits="userSpaceOnUse" width="80" height="80">
                <circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="0.3" />
                <circle cx="40" cy="40" r="50" fill="none" stroke="white" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-error-waves)" />
          </svg>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* City info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-xl font-semibold">{city}</span>
            </div>
            {imageContext?.magnitude && imageContext.magnitude >= 3.0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/30 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="font-bold">M{imageContext.magnitude.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show the generated image (NO AI badge!)
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10">
      {imageUrl.startsWith('data:') ? (
        // Base64 image
        <img
          src={imageUrl}
          alt={`${title} - ${city}`}
          className="w-full h-full object-cover"
        />
      ) : (
        // URL image
        <Image
          src={imageUrl}
          alt={`${title} - ${city}`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
      )}
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      
      {/* City and magnitude info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white/80" />
            <span className="text-xl font-semibold">{city}</span>
          </div>
          {imageContext?.magnitude && imageContext.magnitude >= 3.0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/30 backdrop-blur-sm rounded-full">
              <Activity className="w-4 h-4" />
              <span className="font-bold">M{imageContext.magnitude.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
