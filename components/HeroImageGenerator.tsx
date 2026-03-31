import Image from 'next/image';
import { MapPin, Activity } from 'lucide-react';

interface ImageContext {
  primaryCity: string;
  timestamp: number;
  regionId?: string;
  magnitude?: number;
  heroImageUrl?: string;
}

interface HeroImageGeneratorProps {
  imageContext?: ImageContext;
  title: string;
  category: 'breaking' | 'swarm-alert' | 'weekly-roundup' | 'monthly-report' | 'analysis';
  slug: string;
  date: Date;
  imageUrl?: string | null;
}

const timeGradients: Record<string, string> = {
  dawn: 'from-orange-400/30 via-pink-500/20 to-purple-600/30',
  morning: 'from-blue-400/30 via-cyan-400/20 to-yellow-300/20',
  midday: 'from-blue-500/30 via-sky-400/20 to-white/10',
  afternoon: 'from-yellow-400/30 via-orange-400/20 to-blue-400/20',
  dusk: 'from-orange-500/40 via-pink-500/30 to-purple-700/40',
  evening: 'from-indigo-600/40 via-purple-600/30 to-pink-500/20',
  night: 'from-slate-900/50 via-indigo-900/40 to-purple-900/30',
};

function getTimeOfDay(timestamp: number): string {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 22) return 'evening';
  return 'night';
}

function isRemoteUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}

export default function HeroImageGenerator({
  imageContext,
  title,
  category,
  slug,
  date,
  imageUrl,
}: HeroImageGeneratorProps) {
  const timestamp = imageContext?.timestamp || date.getTime();
  const timeOfDay = getTimeOfDay(timestamp);
  const city = imageContext?.primaryCity || 'Bay Area';

  const hasValidImage = imageUrl && isRemoteUrl(imageUrl);

  if (hasValidImage) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10">
        <Image
          src={imageUrl}
          alt={`${title} - ${city}`}
          fill
          sizes="(max-width: 768px) 100vw, 896px"
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/80" />
              <span className="text-xl font-semibold">{city}</span>
            </div>
            {imageContext?.magnitude && imageContext.magnitude >= 3.0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/30 backdrop-blur-sm rounded-full">
                <Activity className="w-4 h-4" />
                <span className="font-bold">M{imageContext.magnitude.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10 bg-gradient-to-br ${timeGradients[timeOfDay]}`}>
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-5" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`hero-waves-${slug}`} patternUnits="userSpaceOnUse" width="80" height="80">
              <circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="0.3" />
              <circle cx="40" cy="40" r="50" fill="none" stroke="white" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#hero-waves-${slug})`} />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white/80" />
            <span className="text-xl font-semibold">{city}</span>
          </div>
          {imageContext?.magnitude && imageContext.magnitude >= 3.0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/30 rounded-full">
              <Activity className="w-4 h-4" />
              <span className="font-bold">M{imageContext.magnitude.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
