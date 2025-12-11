import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

export default function EarthquakeNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-800 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-neutral-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Earthquake Not Found</h1>
        <p className="text-neutral-400 mb-8">
          We couldn't find the earthquake you're looking for. It may have been removed from the USGS database 
          or the event ID might be incorrect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-neutral-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
        
        <p className="text-xs text-neutral-600 mt-8">
          Try searching the{' '}
          <a 
            href="https://earthquake.usgs.gov/earthquakes/search/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            USGS Earthquake Archive
          </a>
        </p>
      </div>
    </div>
  );
}


