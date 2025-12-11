'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  /**
   * Ad slot ID from your AdSense account
   * Format: data-ad-slot="1234567890"
   */
  slot: string;
  /**
   * Ad format - 'auto' recommended for responsive ads
   */
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  /**
   * Whether the ad should be responsive
   */
  responsive?: boolean;
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Ad layout style for in-feed or in-article ads
   */
  layout?: 'in-article' | 'in-feed';
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner({ 
  slot, 
  format = 'auto', 
  responsive = true,
  className = '',
  layout,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Prevent duplicate ad loads
    if (isLoaded.current) return;
    
    try {
      // Push the ad to load
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isLoaded.current = true;
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // Don't render ads in development (they won't work anyway)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div 
        className={`bg-neutral-800/50 border border-dashed border-neutral-700 rounded-xl flex items-center justify-center text-neutral-500 text-sm ${className}`}
        style={{ minHeight: '90px' }}
      >
        <span>Ad Placeholder (dev mode)</span>
      </div>
    );
  }

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2599154949047210"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layout && { 'data-ad-layout': layout })}
      />
    </div>
  );
}

/**
 * Horizontal banner ad - good for between sections
 */
export function AdBannerHorizontal({ className = '', slot }: { className?: string; slot: string }) {
  return (
    <AdBanner
      slot={slot}
      format="horizontal"
      className={`w-full min-h-[90px] ${className}`}
    />
  );
}

/**
 * In-feed ad - blends with content lists
 */
export function AdBannerInFeed({ className = '', slot }: { className?: string; slot: string }) {
  return (
    <AdBanner
      slot={slot}
      format="fluid"
      layout="in-feed"
      className={className}
    />
  );
}

/**
 * Rectangle/square ad - good for sidebars
 */
export function AdBannerRectangle({ className = '', slot }: { className?: string; slot: string }) {
  return (
    <AdBanner
      slot={slot}
      format="rectangle"
      className={`min-h-[250px] ${className}`}
    />
  );
}


