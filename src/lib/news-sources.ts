/**
 * Bay Area TV Stations - Earthquake News Sources
 * 
 * Direct links to each station's dedicated earthquake coverage page.
 * These are the actual URLs where they publish earthquake stories.
 */

export interface NewsStation {
  id: string;
  name: string;
  shortName: string;
  channel: string;
  earthquakePage: string;
  feedUrl: string; // RSS feed if available
  websiteUrl: string;
  color: string;
  logo?: string;
}

export const TV_STATIONS: NewsStation[] = [
  {
    id: 'ktvu',
    name: 'KTVU Fox 2',
    shortName: 'KTVU',
    channel: '2',
    earthquakePage: 'https://www.ktvu.com/tag/weather/earthquakes',
    feedUrl: 'https://www.ktvu.com/tag/weather/earthquakes.rss',
    websiteUrl: 'https://www.ktvu.com',
    color: '#003399',
  },
  {
    id: 'kron4',
    name: 'KRON4 News',
    shortName: 'KRON 4',
    channel: '4',
    earthquakePage: 'https://www.kron4.com/weather/earthquakes/',
    feedUrl: 'https://www.kron4.com/weather/earthquakes/feed/',
    websiteUrl: 'https://www.kron4.com',
    color: '#0066CC',
  },
  {
    id: 'kpix',
    name: 'CBS News Bay Area',
    shortName: 'CBS',
    channel: '5',
    earthquakePage: 'https://www.cbsnews.com/sanfrancisco/local-news/earthquakes/',
    feedUrl: 'https://www.cbsnews.com/sanfrancisco/local-news/earthquakes/rss/',
    websiteUrl: 'https://www.cbsnews.com/sanfrancisco',
    color: '#0033A0',
  },
  {
    id: 'kgo',
    name: 'ABC7 News',
    shortName: 'ABC 7',
    channel: '7',
    earthquakePage: 'https://abc7news.com/tag/earthquake/',
    feedUrl: 'https://abc7news.com/feed/',
    websiteUrl: 'https://abc7news.com',
    color: '#FF6600',
  },
  {
    id: 'kntv',
    name: 'NBC Bay Area',
    shortName: 'NBC',
    channel: '11',
    earthquakePage: 'https://www.nbcbayarea.com/news/local/earthquakes/',
    feedUrl: 'https://www.nbcbayarea.com/news/local/earthquakes/?rss=y',
    websiteUrl: 'https://www.nbcbayarea.com',
    color: '#E51937',
  },
];

export interface NewspaperSource {
  id: string;
  name: string;
  shortName: string;
  websiteUrl: string;
  feedUrl: string;
  color: string;
}

export const NEWSPAPERS: NewspaperSource[] = [
  {
    id: 'sfchronicle',
    name: 'San Francisco Chronicle',
    shortName: 'SF Chronicle',
    websiteUrl: 'https://www.sfchronicle.com',
    feedUrl: 'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-702.php',
    color: '#000000',
  },
  {
    id: 'mercurynews',
    name: 'Mercury News',
    shortName: 'Mercury News',
    websiteUrl: 'https://www.mercurynews.com',
    feedUrl: 'https://www.mercurynews.com/feed/',
    color: '#0066CC',
  },
  {
    id: 'eastbaytimes',
    name: 'East Bay Times',
    shortName: 'East Bay Times',
    websiteUrl: 'https://www.eastbaytimes.com',
    feedUrl: 'https://www.eastbaytimes.com/feed/',
    color: '#003366',
  },
  {
    id: 'kqed',
    name: 'KQED',
    shortName: 'KQED',
    websiteUrl: 'https://www.kqed.org',
    feedUrl: 'https://www.kqed.org/news/feed',
    color: '#E31837',
  },
];

// Keywords for filtering earthquake content
export const EARTHQUAKE_KEYWORDS = [
  'earthquake', 'quake', 'magnitude', 'temblor', 'seismic',
  'aftershock', 'tremor', 'usgs', 'richter', 'epicenter',
  'fault', 'shaking', 'rattled', 'struck', 'hits',
];

export function isEarthquakeRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return EARTHQUAKE_KEYWORDS.some(kw => lower.includes(kw));
}
