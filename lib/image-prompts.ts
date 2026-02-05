/**
 * AI Image Generation System for Bay Tremor
 * 
 * Generates contextual, realistic images for earthquake news articles
 * using OpenAI's GPT-4o native image generation.
 * 
 * Images are generated based on:
 * - Location (city, landmarks, terrain)
 * - Time of day (sunrise, day, sunset, night)
 * - Season/weather conditions
 * - Article type (breaking news, monthly report, swarm alert)
 * - Earthquake magnitude and severity
 */

import { Earthquake } from './types';
import { BAY_AREA_LANDMARKS, getRegionById, getNearestCity } from './regions';

// ============================================================================
// TIME & WEATHER CONTEXT
// ============================================================================

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type WeatherCondition = 'clear' | 'partly-cloudy' | 'overcast' | 'foggy' | 'rainy' | 'stormy';

/**
 * Determines the time of day from a timestamp
 */
export function getTimeOfDay(timestamp: number): TimeOfDay {
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Gets the season from a date
 */
export function getSeason(timestamp: number): Season {
  const date = new Date(timestamp);
  const month = date.getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Estimates likely weather conditions based on season and time
 * Bay Area has unique microclimates - fog is common in summer mornings!
 */
export function estimateWeather(timestamp: number, cityName?: string): WeatherCondition {
  const season = getSeason(timestamp);
  const timeOfDay = getTimeOfDay(timestamp);
  
  // Bay Area fog patterns - Karl the Fog is famous
  const foggyAreas = ['San Francisco', 'Pacifica', 'Daly City', 'Half Moon Bay', 'Oakland', 'Berkeley'];
  const isFoggyArea = cityName && foggyAreas.some(c => cityName.includes(c));
  
  // Summer mornings in SF = fog
  if (season === 'summer' && (timeOfDay === 'dawn' || timeOfDay === 'morning') && isFoggyArea) {
    return 'foggy';
  }
  
  // Winter = more rain chances
  if (season === 'winter') {
    const rand = Math.random();
    if (rand < 0.3) return 'rainy';
    if (rand < 0.5) return 'overcast';
    return 'partly-cloudy';
  }
  
  // Fall can be foggy in the morning
  if (season === 'fall' && timeOfDay === 'morning' && isFoggyArea) {
    return Math.random() < 0.4 ? 'foggy' : 'clear';
  }
  
  // Default: mostly clear with some variety
  const rand = Math.random();
  if (rand < 0.6) return 'clear';
  if (rand < 0.85) return 'partly-cloudy';
  return 'overcast';
}

// ============================================================================
// LIGHTING DESCRIPTIONS
// ============================================================================

const lightingDescriptions: Record<TimeOfDay, Record<WeatherCondition, string>> = {
  dawn: {
    'clear': 'soft golden light breaking over the eastern hills, warm sunrise glow, long shadows',
    'partly-cloudy': 'dramatic sunrise with clouds painted pink and orange, god rays through clouds',
    'overcast': 'muted blue pre-dawn light, soft diffused illumination',
    'foggy': 'ethereal morning mist glowing gold as sun filters through fog layer',
    'rainy': 'grey dawn light, wet surfaces reflecting the dim sky',
    'stormy': 'dark ominous clouds with occasional breaks of golden light',
  },
  morning: {
    'clear': 'bright morning sunlight, crisp clean light, moderate shadows',
    'partly-cloudy': 'dappled sunlight through scattered clouds, dynamic lighting',
    'overcast': 'soft diffused daylight, no harsh shadows, even illumination',
    'foggy': 'luminous fog softening all details, mysterious atmosphere, Karl the Fog',
    'rainy': 'grey overcast with rain, wet reflective surfaces, moody atmosphere',
    'stormy': 'dark dramatic clouds, occasional lightning illumination',
  },
  midday: {
    'clear': 'bright overhead sunlight, strong contrast, short shadows',
    'partly-cloudy': 'bright with moving cloud shadows, dynamic light',
    'overcast': 'flat even lighting, soft shadows, neutral tones',
    'foggy': 'bright white fog, diffused light from all directions',
    'rainy': 'dark grey skies, wet streets, reflection from puddles',
    'stormy': 'very dark dramatic skies, flashes of lightning',
  },
  afternoon: {
    'clear': 'warm afternoon sunlight, golden hour approaching, long shadows',
    'partly-cloudy': 'warm light with dramatic cloud formations',
    'overcast': 'soft warm diffused light',
    'foggy': 'fog rolling in from the coast, ethereal late afternoon light',
    'rainy': 'steady rain, wet surfaces, moody grey atmosphere',
    'stormy': 'dramatic storm clouds, intense atmosphere',
  },
  dusk: {
    'clear': 'golden hour magic light, warm orange and pink sky, city lights starting',
    'partly-cloudy': 'spectacular sunset colors on clouds, orange purple pink gradient sky',
    'overcast': 'muted sunset, soft pastel sky colors',
    'foggy': 'fog glowing pink and orange from sunset, magical ethereal atmosphere',
    'rainy': 'moody blue hour, city lights reflecting on wet streets',
    'stormy': 'dramatic dark clouds with sunset colors breaking through',
  },
  evening: {
    'clear': 'blue hour, city lights twinkling, deep blue sky with stars appearing',
    'partly-cloudy': 'blue hour with dramatic clouds, city lights illuminating',
    'overcast': 'soft blue grey evening, warm city lights providing contrast',
    'foggy': 'fog glowing from city lights below, mysterious urban atmosphere',
    'rainy': 'rainy evening, neon reflections on wet pavement, cinematic',
    'stormy': 'lightning illuminating the cityscape, dramatic',
  },
  night: {
    'clear': 'clear night sky, stars visible, city lights bright against dark sky',
    'partly-cloudy': 'moon peeking through clouds, city glow on cloud bottoms',
    'overcast': 'ambient city glow illuminating low clouds, urban night',
    'foggy': 'mysterious fog-shrouded city, halos around streetlights',
    'rainy': 'rainy night, wet streets reflecting neon and streetlights, noir atmosphere',
    'stormy': 'dramatic lightning storm, city illuminated by flashes',
  },
};

function getLightingDescription(timeOfDay: TimeOfDay, weather: WeatherCondition): string {
  return lightingDescriptions[timeOfDay][weather];
}

// ============================================================================
// CITY VISUAL DESCRIPTIONS
// ============================================================================

interface CityVisualProfile {
  name: string;
  visualElements: string[];
  landmarks: string[];
  terrain: string;
  architectureStyle: string;
  atmosphere: string;
}

const cityVisualProfiles: Record<string, CityVisualProfile> = {
  'San Francisco': {
    name: 'San Francisco',
    visualElements: ['iconic Victorian houses', 'steep hills', 'cable cars', 'bay views'],
    landmarks: ['Golden Gate Bridge', 'Transamerica Pyramid', 'Coit Tower', 'Painted Ladies'],
    terrain: 'dramatic hills overlooking the San Francisco Bay',
    architectureStyle: 'mix of Victorian, Edwardian, and modern glass towers',
    atmosphere: 'urban sophistication with natural beauty',
  },
  'Oakland': {
    name: 'Oakland',
    visualElements: ['diverse urban landscape', 'port cranes', 'Lake Merritt', 'Oakland hills'],
    landmarks: ['Jack London Square', 'Fox Theater', 'Tribune Tower'],
    terrain: 'flatlands rising to Oakland Hills',
    architectureStyle: 'industrial converted to hip, Art Deco downtown',
    atmosphere: 'gritty authenticity mixed with creative energy',
  },
  'Berkeley': {
    name: 'Berkeley',
    visualElements: ['UC Berkeley campus', 'Campanile tower', 'tree-lined streets', 'college town'],
    landmarks: ['Sather Tower', 'UC Berkeley campus', 'Tilden Park'],
    terrain: 'flatlands rising to Berkeley Hills',
    architectureStyle: 'academic Gothic, Craftsman homes, 1960s modernism',
    atmosphere: 'intellectual, progressive, bohemian',
  },
  'San Jose': {
    name: 'San Jose',
    visualElements: ['downtown skyline', 'tech campuses', 'palm trees', 'suburban sprawl'],
    landmarks: ['San Jose City Hall', 'SAP Center', 'Tech Museum'],
    terrain: 'Santa Clara Valley floor with Diablo Range backdrop',
    architectureStyle: 'modern glass office buildings, Spanish colonial revival',
    atmosphere: 'tech hub energy, diverse communities',
  },
  'Fremont': {
    name: 'Fremont',
    visualElements: ['Mission Peak', 'suburban neighborhoods', 'tech campuses', 'hills backdrop'],
    landmarks: ['Mission Peak', 'Fremont Central Park', 'Niles Canyon'],
    terrain: 'bay flatlands with Mission Peak rising dramatically',
    architectureStyle: 'suburban residential, modern tech campuses',
    atmosphere: 'family-oriented tech suburb',
  },
  'San Ramon': {
    name: 'San Ramon',
    visualElements: ['I-680 corridor', 'corporate headquarters', 'Iron Horse Trail', 'rolling hills'],
    landmarks: ['Bishop Ranch', 'Mt. Diablo in background'],
    terrain: 'San Ramon Valley with Mt. Diablo backdrop',
    architectureStyle: 'modern corporate campuses, upscale suburban',
    atmosphere: 'affluent business park community',
  },
  'Walnut Creek': {
    name: 'Walnut Creek',
    visualElements: ['downtown shopping', 'Mt. Diablo views', 'upscale suburban', 'Iron Horse Trail'],
    landmarks: ['Mt. Diablo', 'Broadway Plaza', 'Lesher Center'],
    terrain: 'valley floor with dramatic Mt. Diablo views',
    architectureStyle: 'modern mixed-use downtown, upscale residential',
    atmosphere: 'affluent suburban elegance',
  },
  'Palo Alto': {
    name: 'Palo Alto',
    visualElements: ['Stanford University', 'University Avenue', 'tech startups', 'tree-lined streets'],
    landmarks: ['Stanford campus', 'Hoover Tower', 'University Avenue'],
    terrain: 'flat valley floor with foothills backdrop',
    architectureStyle: 'Spanish colonial, modern tech, craftsman homes',
    atmosphere: 'intellectual wealth, innovation hub',
  },
  'Napa': {
    name: 'Napa',
    visualElements: ['wine country', 'rolling vineyards', 'wine train', 'riverfront'],
    landmarks: ['Napa Valley vineyards', 'Oxbow Public Market', 'wine estates'],
    terrain: 'Napa Valley floor surrounded by rolling vine-covered hills',
    architectureStyle: 'wine country estates, renovated downtown',
    atmosphere: 'wine country sophistication',
  },
  'Santa Rosa': {
    name: 'Santa Rosa',
    visualElements: ['downtown square', 'wine country gateway', 'suburban neighborhoods'],
    landmarks: ['Railroad Square', 'Charles M. Schulz Museum'],
    terrain: 'Santa Rosa Plain with Sonoma Mountains',
    architectureStyle: 'mix of historic downtown and modern suburban',
    atmosphere: 'wine country casual, recovering from fires',
  },
};

// Default profile for cities not explicitly defined
const defaultCityProfile: CityVisualProfile = {
  name: 'Bay Area',
  visualElements: ['California suburban landscape', 'palm trees', 'Mediterranean climate'],
  landmarks: ['distant Bay views', 'rolling hills'],
  terrain: 'typical Bay Area landscape',
  architectureStyle: 'California residential and commercial',
  atmosphere: 'quintessential Northern California',
};

function getCityProfile(cityName: string): CityVisualProfile {
  return cityVisualProfiles[cityName] || { ...defaultCityProfile, name: cityName };
}

// ============================================================================
// ARTICLE TYPE STYLES
// ============================================================================

export type ArticleType = 'breaking' | 'swarm-alert' | 'weekly-roundup' | 'monthly-report' | 'analysis';

interface ArticleImageStyle {
  mood: string;
  colorTone: string;
  focus: string;
  dramaticLevel: 'subtle' | 'moderate' | 'dramatic' | 'intense';
  additionalElements: string[];
}

const articleStyles: Record<ArticleType, ArticleImageStyle> = {
  'breaking': {
    mood: 'urgent, newsworthy, dramatic',
    colorTone: 'high contrast, vivid',
    focus: 'immediate aftermath feeling, tension in the air',
    dramaticLevel: 'intense',
    additionalElements: ['sense of motion blur', 'dramatic sky', 'heightened reality'],
  },
  'swarm-alert': {
    mood: 'alert but not panic, monitoring situation',
    colorTone: 'amber and orange undertones',
    focus: 'the ground, geological context',
    dramaticLevel: 'dramatic',
    additionalElements: ['subtle vibration effect', 'alert feeling'],
  },
  'weekly-roundup': {
    mood: 'informative, documentary-style',
    colorTone: 'natural, true-to-life colors',
    focus: 'establishing shot of the region',
    dramaticLevel: 'moderate',
    additionalElements: ['wide angle', 'context-rich composition'],
  },
  'monthly-report': {
    mood: 'analytical, comprehensive, professional',
    colorTone: 'rich, magazine-quality',
    focus: 'beautiful cityscape or landscape',
    dramaticLevel: 'subtle',
    additionalElements: ['cinematic composition', 'premium photography feel'],
  },
  'analysis': {
    mood: 'thoughtful, scientific',
    colorTone: 'cool, analytical blues',
    focus: 'geological or technical perspective',
    dramaticLevel: 'subtle',
    additionalElements: ['clean composition', 'educational feel'],
  },
};

// ============================================================================
// MAGNITUDE-BASED VISUAL EFFECTS
// ============================================================================

function getMagnitudeVisualEffect(magnitude: number): string {
  if (magnitude >= 6.0) {
    return 'aftermath of significant shaking visible, some structural concerns, people on streets, emergency response';
  }
  if (magnitude >= 5.0) {
    return 'noticeable sense of alert, some people looking around, minor debris possible';
  }
  if (magnitude >= 4.0) {
    return 'subtle tension in the atmosphere, people momentarily paused';
  }
  if (magnitude >= 3.0) {
    return 'normal city scene with perhaps slight awareness';
  }
  return 'peaceful normal cityscape';
}

// ============================================================================
// MAIN PROMPT GENERATOR
// ============================================================================

export interface ImagePromptConfig {
  earthquake?: Earthquake;
  timestamp?: number;
  cityName?: string;
  articleType: ArticleType;
  customMood?: string;
  includeSeismicHint?: boolean;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3';
}

export interface GeneratedPrompt {
  prompt: string;
  negativePrompt: string;
  style: string;
  metadata: {
    city: string;
    timeOfDay: TimeOfDay;
    weather: WeatherCondition;
    season: Season;
    magnitude?: number;
  };
}

/**
 * Generates a comprehensive GPT-4o image prompt for earthquake news images
 */
export function generateImagePrompt(config: ImagePromptConfig): GeneratedPrompt {
  const { earthquake, articleType, customMood, includeSeismicHint = true } = config;
  
  // Determine location
  let cityName = config.cityName || 'San Francisco';
  if (earthquake) {
    const nearestCity = getNearestCity(earthquake.latitude, earthquake.longitude);
    if (nearestCity) {
      cityName = nearestCity.name;
    }
  }
  
  // Determine time context
  const timestamp = config.timestamp || earthquake?.timestamp || Date.now();
  const timeOfDay = getTimeOfDay(timestamp);
  const season = getSeason(timestamp);
  const weather = estimateWeather(timestamp, cityName);
  
  // Get visual profiles and styles
  const cityProfile = getCityProfile(cityName);
  const articleStyle = articleStyles[articleType];
  const lighting = getLightingDescription(timeOfDay, weather);
  
  // Build the prompt
  const promptParts: string[] = [];
  
  // Core subject
  promptParts.push(`Photorealistic wide shot of ${cityProfile.name}, California`);
  
  // Visual elements
  const visualElements = cityProfile.visualElements.slice(0, 2).join(' and ');
  promptParts.push(`featuring ${visualElements}`);
  
  // Landmarks (pick one for focus)
  if (cityProfile.landmarks.length > 0) {
    const landmark = cityProfile.landmarks[Math.floor(Math.random() * cityProfile.landmarks.length)];
    promptParts.push(`with ${landmark} visible`);
  }
  
  // Terrain and setting
  promptParts.push(`set against ${cityProfile.terrain}`);
  
  // Time and lighting
  promptParts.push(`during ${timeOfDay}`);
  promptParts.push(lighting);
  
  // Weather
  if (weather !== 'clear') {
    const weatherDescs: Record<WeatherCondition, string> = {
      'clear': '',
      'partly-cloudy': 'with scattered clouds in the sky',
      'overcast': 'under overcast grey skies',
      'foggy': 'with characteristic San Francisco fog rolling through',
      'rainy': 'during rainfall with wet streets',
      'stormy': 'with dramatic storm clouds',
    };
    promptParts.push(weatherDescs[weather]);
  }
  
  // Article-specific mood
  promptParts.push(`mood: ${customMood || articleStyle.mood}`);
  promptParts.push(`color palette: ${articleStyle.colorTone}`);
  
  // Seismic hint for earthquake articles
  if (includeSeismicHint && earthquake && earthquake.magnitude >= 3.5) {
    const magnitudeEffect = getMagnitudeVisualEffect(earthquake.magnitude);
    promptParts.push(magnitudeEffect);
  }
  
  // Style additions
  const styleAdditions = articleStyle.additionalElements.join(', ');
  promptParts.push(styleAdditions);
  
  // Photography style
  promptParts.push('professional editorial photography, sharp details, cinematic composition');
  promptParts.push('shot on Sony A7R IV with 24-70mm f/2.8 lens');
  
  const prompt = promptParts.join('. ');
  
  // Negative prompt to avoid common AI image generation issues
  const negativePrompt = [
    'cartoon', 'illustration', 'painting', 'drawing', 'anime',
    'blurry', 'low quality', 'watermark', 'text', 'signature',
    'oversaturated', 'unrealistic colors', 'distorted buildings',
    'wrong architecture', 'impossible geometry', 'floating objects',
    'extra limbs on people', 'deformed faces'
  ].join(', ');
  
  return {
    prompt,
    negativePrompt,
    style: 'photographic',
    metadata: {
      city: cityName,
      timeOfDay,
      weather,
      season,
      magnitude: earthquake?.magnitude,
    },
  };
}

// ============================================================================
// SPECIALIZED PROMPT GENERATORS
// ============================================================================

/**
 * Generate a prompt for breaking earthquake news
 */
export function generateBreakingNewsPrompt(earthquake: Earthquake): GeneratedPrompt {
  return generateImagePrompt({
    earthquake,
    articleType: 'breaking',
    includeSeismicHint: true,
  });
}

/**
 * Generate a prompt for monthly report hero image
 */
export function generateMonthlyReportPrompt(year: number, month: number, primaryCity?: string): GeneratedPrompt {
  // Use mid-month timestamp for accurate season/weather
  const timestamp = new Date(year, month, 15, 14, 0, 0).getTime(); // 2 PM mid-month
  
  return generateImagePrompt({
    timestamp,
    cityName: primaryCity || 'San Francisco',
    articleType: 'monthly-report',
    customMood: 'cinematic panoramic establishing shot, magazine cover quality',
    includeSeismicHint: false,
  });
}

/**
 * Generate a prompt for weekly roundup
 */
export function generateWeeklyRoundupPrompt(weekStartDate: Date, topCity?: string): GeneratedPrompt {
  return generateImagePrompt({
    timestamp: weekStartDate.getTime(),
    cityName: topCity || 'Oakland',
    articleType: 'weekly-roundup',
    includeSeismicHint: false,
  });
}

/**
 * Generate a prompt for swarm alert
 */
export function generateSwarmAlertPrompt(regionId: string, peakMagnitude: number): GeneratedPrompt {
  const region = getRegionById(regionId);
  const cities = region?.name.split(' / ') || ['San Ramon'];
  const primaryCity = cities[0];
  
  // Create a mock earthquake for context
  const mockEarthquake: Earthquake = {
    id: 'swarm',
    magnitude: peakMagnitude,
    place: `${primaryCity} area`,
    time: new Date(),
    timestamp: Date.now(),
    latitude: 37.7799,
    longitude: -121.9780,
    depth: 8,
    felt: null,
    significance: 100,
    url: '',
    region: regionId,
  };
  
  return generateImagePrompt({
    earthquake: mockEarthquake,
    cityName: primaryCity,
    articleType: 'swarm-alert',
    customMood: 'geological tension, earth awareness, alert but not panic',
  });
}

// ============================================================================
// BATCH PROMPT GENERATION FOR CITIES
// ============================================================================

/**
 * Generate a set of prompts for all major Bay Area cities
 * Useful for pre-generating a library of images
 */
export function generateCityLibraryPrompts(): GeneratedPrompt[] {
  const majorCities = [
    'San Francisco', 'Oakland', 'Berkeley', 'San Jose', 'Fremont',
    'San Ramon', 'Walnut Creek', 'Palo Alto', 'Napa', 'Santa Rosa'
  ];
  
  const timesOfDay: TimeOfDay[] = ['dawn', 'morning', 'afternoon', 'dusk', 'night'];
  const prompts: GeneratedPrompt[] = [];
  
  for (const city of majorCities) {
    for (const time of timesOfDay) {
      // Create timestamp for the specific time of day
      const date = new Date();
      const hours: Record<TimeOfDay, number> = {
        dawn: 6, morning: 9, midday: 12, afternoon: 15, dusk: 18, evening: 20, night: 22
      };
      date.setHours(hours[time], 0, 0, 0);
      
      prompts.push(generateImagePrompt({
        timestamp: date.getTime(),
        cityName: city,
        articleType: 'monthly-report', // Use highest quality style
        includeSeismicHint: false,
      }));
    }
  }
  
  return prompts;
}
