'use client';

import { Zap } from 'lucide-react';

// Quick Report Floating Button - kept for the "Did You Feel It?" feature
export function QuickReportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm sm:text-base font-semibold rounded-full shadow-2xl shadow-orange-500/30 hover:from-amber-400 hover:to-orange-500 hover:scale-105 transition-all group max-w-[calc(100vw-24px)] sm:max-w-none"
    >
      <Zap className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse flex-shrink-0" />
      <span className="truncate">Did You Feel It?</span>
    </button>
  );
}
