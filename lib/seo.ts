// Comprehensive SEO utilities and structured data generators
import { REGIONS, BAY_AREA_LANDMARKS } from './regions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

// WebSite Schema - helps Google understand your site
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bay Tremor',
    alternateName: ['Bay Area Earthquake Tracker', 'BayTremor', 'SF Earthquake Monitor'],
    url: baseUrl,
    description: 'Real-time earthquake tracking and seismic monitoring for the San Francisco Bay Area. Live USGS data, swarm detection, and regional analysis.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
  };
}

// Organization Schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bay Tremor',
    url: baseUrl,
    logo: `${baseUrl}/android-chrome-512x512.png`,
    description: 'Bay Area earthquake monitoring and seismic activity tracking service.',
    sameAs: [
      'https://twitter.com/baytremor',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 37.75,
        longitude: -122.25,
      },
      geoRadius: '150000', // 150km radius covering Bay Area
    },
  };
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Earthquake Event Schema (for individual earthquake pages)
export function generateEarthquakeEventSchema(earthquake: {
  id: string;
  magnitude: number;
  place: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  depth: number;
  felt?: number | null;
}) {
  const date = new Date(earthquake.timestamp);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${baseUrl}/earthquake/${earthquake.id}`,
    name: `M${earthquake.magnitude.toFixed(1)} Earthquake - ${earthquake.place}`,
    description: `A magnitude ${earthquake.magnitude.toFixed(1)} earthquake occurred ${earthquake.place} at a depth of ${earthquake.depth.toFixed(1)} km.`,
    startDate: date.toISOString(),
    endDate: date.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: earthquake.place,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: earthquake.latitude,
        longitude: earthquake.longitude,
        elevation: -earthquake.depth * 1000, // Convert km to meters, negative for depth
      },
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'California',
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'USGS',
      url: 'https://earthquake.usgs.gov',
    },
    about: {
      '@type': 'Thing',
      name: 'Earthquake',
      description: 'Seismic event',
    },
  };
}

// Article Schema for earthquake detail pages (helps with rich snippets)
export function generateEarthquakeArticleSchema(earthquake: {
  id: string;
  magnitude: number;
  place: string;
  timestamp: number;
  depth: number;
  region: string;
}) {
  const date = new Date(earthquake.timestamp);
  const regionInfo = REGIONS.find(r => r.id === earthquake.region);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: `M${earthquake.magnitude.toFixed(1)} Earthquake Strikes ${earthquake.place}`,
    description: `A magnitude ${earthquake.magnitude.toFixed(1)} earthquake was recorded ${earthquake.place} at ${earthquake.depth.toFixed(1)}km depth. View details, location, and analysis.`,
    image: `${baseUrl}/earthquake/${earthquake.id}/opengraph-image`,
    datePublished: date.toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tremor',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/android-chrome-512x512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/earthquake/${earthquake.id}`,
    },
    keywords: [
      'earthquake',
      earthquake.place,
      regionInfo?.name || '',
      regionInfo?.county || '',
      'California',
      'seismic activity',
      'Bay Area',
      `magnitude ${earthquake.magnitude.toFixed(1)}`,
    ].filter(Boolean),
  };
}

// LocalBusiness Schema for regional pages
export function generateRegionSchema(regionId: string) {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return null;
  
  const centerLat = (region.bounds.minLat + region.bounds.maxLat) / 2;
  const centerLon = (region.bounds.minLon + region.bounds.maxLon) / 2;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: region.name,
    description: `${region.description}. Earthquake monitoring for ${region.county} County along the ${region.faultLine}.`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: centerLat,
      longitude: centerLon,
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'California',
      addressCountry: 'US',
      postalCode: region.areaCode,
    },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: 'San Francisco Bay Area',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'California',
        addressCountry: 'US',
      },
    },
  };
}

// FAQ Schema for FAQ pages
export function generateFAQSchema() {
  const faqs = [
    {
      question: 'How often do earthquakes occur in the San Francisco Bay Area?',
      answer: 'The Bay Area experiences hundreds of small earthquakes every year. Most are too small to feel, but the region is one of the most seismically active in the United States due to the San Andreas, Hayward, and Calaveras fault systems.',
    },
    {
      question: 'What is an earthquake swarm?',
      answer: 'An earthquake swarm is a sequence of many small earthquakes occurring in the same area over a relatively short period of time without a clear mainshock. Swarms can last from days to months and are common in the Bay Area, particularly in the San Ramon and South Bay regions.',
    },
    {
      question: 'Is the Bay Area due for a major earthquake?',
      answer: 'Scientists estimate there is a 72% probability that the Bay Area will experience a magnitude 6.7 or greater earthquake within the next 30 years. The Hayward Fault is considered particularly hazardous due to its proximity to dense urban areas.',
    },
    {
      question: 'What is the difference between magnitude and intensity?',
      answer: 'Magnitude measures the energy released by an earthquake at its source using instruments. Intensity measures the effects and shaking felt at a specific location. A single earthquake has one magnitude but can have many different intensities depending on distance from the epicenter.',
    },
    {
      question: 'Where does Bay Tremor get its earthquake data?',
      answer: 'Bay Tremor uses real-time data from the United States Geological Survey (USGS) earthquake monitoring network. The USGS operates a comprehensive network of seismometers throughout California and provides authoritative earthquake information.',
    },
    {
      question: 'How quickly are earthquakes detected and reported?',
      answer: 'Modern seismic networks can detect earthquakes within seconds of occurrence. Preliminary information is typically available within 2-5 minutes, with refined data following within 15-30 minutes as more seismic stations report data.',
    },
    {
      question: 'What causes earthquakes in the Bay Area?',
      answer: 'Bay Area earthquakes are caused by the movement of the Pacific Plate past the North American Plate along the San Andreas Fault system. This movement creates stress that builds up and is released as earthquakes along various faults in the region.',
    },
    {
      question: 'What does earthquake depth mean?',
      answer: 'Earthquake depth is the distance from the Earth\'s surface to the point where the earthquake rupture starts (hypocenter). Shallow earthquakes (less than 20km) typically cause more surface shaking, while deeper earthquakes may be felt over a wider area but with less intensity.',
    },
  ];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// GeoShape Schema for regional coverage
export function generateGeoShapeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GeoShape',
    box: '36.5,-123.5 39.0,-121.0', // Northern California bounding box
    description: 'San Francisco Bay Area seismic monitoring coverage area',
  };
}

// Generate all homepage schemas combined
export function generateHomepageSchemas() {
  return [
    generateWebsiteSchema(),
    generateOrganizationSchema(),
    generateGeoShapeSchema(),
  ];
}

// City-specific SEO data
export function getCityData(citySlug: string) {
  const cityName = citySlug.replace(/-/g, ' ');
  const city = BAY_AREA_LANDMARKS.find(
    l => l.name.toLowerCase() === cityName.toLowerCase() && l.type === 'city'
  );
  
  if (!city) return null;
  
  // Find which region this city belongs to
  const region = REGIONS.find(r => {
    const { minLat, maxLat, minLon, maxLon } = r.bounds;
    return city.lat >= minLat && city.lat <= maxLat && 
           city.lon >= minLon && city.lon <= maxLon;
  });
  
  return {
    city,
    region,
    seoTitle: `${city.name} Earthquakes - Live Seismic Activity | Bay Tremor`,
    seoDescription: `Track earthquakes near ${city.name}, ${city.county} County, California. Real-time seismic monitoring, historical data, and earthquake alerts for ${city.name} residents.`,
    keywords: [
      `${city.name} earthquakes`,
      `${city.name} seismic activity`,
      `${city.county} County earthquakes`,
      `earthquakes near ${city.name}`,
      `${city.name} earthquake history`,
      `${city.name} California earthquakes`,
      region?.faultLine || '',
      'Bay Area earthquakes',
    ].filter(Boolean),
  };
}

// Region-specific SEO data
export function getRegionSEOData(regionId: string) {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return null;
  
  const cities = BAY_AREA_LANDMARKS
    .filter(l => l.type === 'city')
    .filter(city => {
      const { minLat, maxLat, minLon, maxLon } = region.bounds;
      return city.lat >= minLat && city.lat <= maxLat && 
             city.lon >= minLon && city.lon <= maxLon;
    })
    .map(c => c.name);
  
  return {
    region,
    cities,
    seoTitle: `${region.name} Earthquakes - Live Tracking | Bay Tremor`,
    seoDescription: `Real-time earthquake monitoring for ${region.name}. Track seismic activity along the ${region.faultLine} in ${region.county} County. Historical data, swarm detection, and alerts.`,
    keywords: [
      `${region.name} earthquakes`,
      `${region.county} County earthquakes`,
      `${region.faultLine} earthquakes`,
      `${region.areaCode} area earthquakes`,
      ...cities.map(c => `${c} earthquakes`),
      'Bay Area seismic activity',
      'California earthquakes',
      'earthquake swarm',
      'earthquake tracker',
    ],
  };
}


