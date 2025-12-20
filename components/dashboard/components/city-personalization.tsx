'use client';

import { House, MapPin, ChevronRight } from 'lucide-react';

interface CityPersonalizationProps {
  myCity: {
    cityName: string;
    areaCode?: string;
  } | null;
  myCityStats: {
    nearbyThisWeek: number;
    isElevated: boolean;
  } | null;
  availableCities: Array<{ name: string; areaCode: string; county: string }>;
  onOpenSelector: () => void;
  isLoaded: boolean;
}

export function CityPersonalization({
  myCity,
  myCityStats,
  availableCities,
  onOpenSelector,
  isLoaded,
}: CityPersonalizationProps) {
  // Get area code from city lookup if not stored
  const areaCode = myCity?.areaCode || 
    availableCities.find(c => c.name === myCity?.cityName)?.areaCode || '';

  return (
    <button
      onClick={onOpenSelector}
      className="w-full card p-5 text-left group hover:bg-white/[0.03] transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Icon / Area Code */}
        {isLoaded && myCity ? (
          <div className="w-14 h-14 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-xl font-semibold text-white">
              {areaCode}
            </span>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
            <House className="w-6 h-6 text-neutral-500" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoaded && myCity ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{myCity.cityName}</span>
                {myCityStats?.isElevated && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Active
                  </span>
                )}
              </div>
              <div className="text-sm text-neutral-500 mt-0.5">
                <span className="text-neutral-300 font-medium tabular-nums">
                  {myCityStats?.nearbyThisWeek || 0}
                </span>{' '}
                earthquakes nearby this week
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-white">Personalize your view</div>
              <div className="text-sm text-neutral-500 mt-0.5">
                Select your city for local earthquake stats
              </div>
            </>
          )}
        </div>

        {/* Action indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors hidden sm:block">
            {myCity ? 'Change' : 'Set up'}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </div>
      </div>
    </button>
  );
}

