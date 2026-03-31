export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <header className="pt-6 sm:pt-8 pb-6">
          <div className="h-8 bg-white/10 rounded w-56 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-96 max-w-full mt-3 animate-pulse" />
        </header>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 space-y-6">
        {/* Summary cards skeleton */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-white/10 rounded w-1/3" />
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-white/5"
              >
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-7 bg-white/5 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="card p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-4 bg-white/5 rounded w-12" />
                </div>
                <div className="h-2 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Earthquake list skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-white/10 rounded w-40 animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-32 animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.02] rounded-xl border border-white/5 animate-pulse"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/5" />
                  <div className="h-3 bg-white/5 rounded w-2/5" />
                </div>
                <div className="hidden sm:block h-6 w-20 bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
