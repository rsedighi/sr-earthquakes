import type { Earthquake, EarthquakeFeedSnapshot } from '@/lib/types';

export type TabId = 'live' | 'community' | 'neighborhood' | 'compare' | 'history' | 'learn';

export const TAB_ROUTES: Record<TabId, string> = {
  live: '/',
  community: '/community',
  neighborhood: '/my-area',
  compare: '/compare',
  history: '/history',
  learn: '/learn',
};

export type ForumCategory = 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';

export type TimeFilter = 'hour' | '6hours' | 'today' | 'week' | null;

export type MagnitudeFilter = 'all' | 'm2plus' | 'm3plus' | 'felt';

export interface HistoricalSummary {
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  magnitudeRange: {
    min: number;
    max: number;
    avg: number;
  };
  byRegion: Record<string, number>;
  biggestQuake: {
    id: string;
    magnitude: number;
    place: string;
    timestamp: number;
    region: string;
  } | null;
  regionStats: Array<{
    regionId: string;
    totalCount: number;
    avgMagnitude: number;
    maxMagnitude: number;
  }>;
  swarmSummaries: Array<{
    id: string;
    startTime: string;
    endTime: string;
    peakMagnitude: number;
    totalCount: number;
    region: string;
  }>;
  sanRamonCount: number;
  santaClaraCount: number;
  sanRamonSwarmCount: number;
  santaClaraSwarmCount: number;
  avgWeeklyRate: number;
}

export interface DashboardProps {
  historicalSummary: HistoricalSummary | null;
  initialTab?: TabId;
  initialFeed?: EarthquakeFeedSnapshot;
  forumCategory?: ForumCategory;
  forumThread?: string;
}

export interface HotspotRegion {
  regionId: string;
  region: { name: string; color?: string; faultLine?: string } | null | undefined;
  count: number;
  isElevated: boolean;
  multiplier: number;
}

export interface MyCityData {
  cityName: string;
  areaCode?: string;
  lat: number;
  lon: number;
}

export interface MyCityStatsData {
  nearbyThisWeek: number;
  isElevated: boolean;
}
