export default function MyAreaLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header skeleton — matches static shell dimensions */}
        <header className="pt-6 sm:pt-8 pb-6 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded w-40" />
            <div className="h-4 bg-white/5 rounded w-64" />
          </div>
        </header>

        {/* Address search bar */}
        <div className="space-y-6 animate-pulse">
          <div className="h-12 bg-white/5 rounded-xl border border-white/10" />

          {/* Empty state prompt */}
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10" />
            <div className="h-5 bg-white/10 rounded w-64 mx-auto mb-3" />
            <div className="h-4 bg-white/5 rounded w-80 mx-auto mb-6" />
            <div className="flex justify-center gap-2">
              <div className="h-7 bg-white/5 rounded-full w-28" />
              <div className="h-7 bg-white/5 rounded-full w-24" />
              <div className="h-7 bg-white/5 rounded-full w-32" />
            </div>
          </div>

          {/* Map placeholder */}
          <div className="h-[400px] bg-white/5 rounded-xl border border-white/10" />
        </div>
      </div>
    </div>
  );
}
