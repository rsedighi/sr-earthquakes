import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Seismograph icon with spinner */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-10 h-10 text-emerald-400"
            >
              <path
                d="M2 12h4l3-9 6 18 3-9h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-emerald-500/20 animate-spin" />
        </div>
        <p className="text-neutral-400 text-sm animate-pulse">Loading earthquake data...</p>
      </div>
    </div>
  );
}

