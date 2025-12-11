'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-neutral-400 mb-8">
          We encountered an unexpected error while loading this page. 
          Our team has been notified and is working on a fix.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
            <p className="text-xs text-neutral-500 mb-1">Error details:</p>
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-neutral-600 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-neutral-600">
          If this problem persists, please check the{' '}
          <a 
            href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            USGS status
          </a>
          .
        </p>
      </div>
    </div>
  );
}


