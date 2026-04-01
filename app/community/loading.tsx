export default function CommunityLoading() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Banner */}
      <div className="h-24 sm:h-32 bg-gradient-to-r from-orange-600/30 to-amber-500/30 animate-pulse" />

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex items-end gap-4 animate-pulse">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-800 border-4 border-[#0a0a0a]" />
          <div className="pb-2 flex-1 space-y-2">
            <div className="h-7 bg-white/10 rounded w-56" />
            <div className="h-4 bg-white/5 rounded w-40" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Feed */}
          <div className="flex-1 space-y-4">
            {/* Create post card */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-3 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-neutral-800" />
              <div className="flex-1 h-10 bg-neutral-800/50 rounded-md" />
              <div className="w-8 h-8 rounded bg-neutral-800/30" />
              <div className="w-8 h-8 rounded bg-neutral-800/30" />
            </div>

            {/* Sort tabs */}
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-2 flex items-center gap-1 animate-pulse">
              <div className="h-9 w-20 rounded-full bg-neutral-800" />
              <div className="h-9 w-20 rounded-full bg-neutral-800/30" />
              <div className="h-9 w-20 rounded-full bg-neutral-800/30" />
            </div>

            {/* Post skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1b] rounded-lg border border-neutral-800 flex overflow-hidden animate-pulse"
              >
                <div className="w-10 sm:w-12 bg-neutral-900/50 flex flex-col items-center py-3 gap-2">
                  <div className="w-5 h-5 rounded bg-white/5" />
                  <div className="w-4 h-3 rounded bg-white/5" />
                  <div className="w-5 h-5 rounded bg-white/5" />
                </div>
                <div className="flex-1 p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 rounded-full bg-white/5" />
                    <div className="h-3 w-24 rounded bg-white/5" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                  </div>
                  <div className="h-5 rounded bg-white/10 w-4/5" />
                  <div className="h-4 rounded bg-white/5 w-3/5" />
                  <div className="flex items-center gap-4 pt-1">
                    <div className="h-4 w-24 rounded bg-white/5" />
                    <div className="h-4 w-14 rounded bg-white/5" />
                    <div className="h-4 w-12 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 space-y-4 animate-pulse">
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 overflow-hidden">
              <div className="h-10 bg-gradient-to-r from-orange-600/30 to-amber-500/30" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/10 rounded w-36" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-4/5" />
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-800">
                  <div className="space-y-1">
                    <div className="h-6 bg-white/10 rounded w-12" />
                    <div className="h-3 bg-white/5 rounded w-10" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-6 bg-white/10 rounded w-8" />
                    <div className="h-3 bg-white/5 rounded w-12" />
                  </div>
                </div>
                <div className="h-10 bg-orange-500/20 rounded-full" />
              </div>
            </div>
            <div className="bg-[#1a1a1b] rounded-lg border border-neutral-800 p-4 space-y-3">
              <div className="h-5 bg-white/10 rounded w-40" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded w-full" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
