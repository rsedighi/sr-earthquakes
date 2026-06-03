'use client';

import { Loader2 } from 'lucide-react';

export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mx-auto mb-4" />
        <p className="text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}


