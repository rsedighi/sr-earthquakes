import OpenAI from 'openai';
import { Earthquake, SwarmEvent } from './types';
import { getRegionById } from './regions';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openai) return openai;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not found. AI summaries will be disabled.');
    return null;
  }
  
  openai = new OpenAI({ apiKey });
  return openai;
}

export interface ActivitySummaryInput {
  regionId: string;
  currentCount: number;
  averageCount: number;
  multiplier: number;
  largestMagnitude: number;
  recentQuakes: Earthquake[];
  historicalSwarms?: SwarmEvent[];
  isSwarm?: boolean;
}

export async function generateActivitySummary(input: ActivitySummaryInput): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  
  const region = getRegionById(input.regionId);
  const regionName = region?.name || input.regionId;
  const faultLine = region?.faultLine || 'local fault';
  
  const recentQuakesSummary = input.recentQuakes.slice(0, 10).map(q => 
    `M${q.magnitude.toFixed(1)} at ${q.depth.toFixed(0)}km depth`
  ).join(', ');
  
  const prompt = `You are a seismologist writing a brief, informative summary for the public about earthquake activity. Be calm, factual, and reassuring while being informative.

Current situation:
- Region: ${regionName}
- Fault line: ${faultLine}
- Earthquakes this week: ${input.currentCount}
- Typical weekly average: ${input.averageCount}
- Activity level: ${input.multiplier.toFixed(1)}× normal
- Largest this week: M${input.largestMagnitude.toFixed(1)}
- Recent quakes: ${recentQuakesSummary}
- Swarm detected: ${input.isSwarm ? 'Yes' : 'No'}

Write a 2-3 sentence summary explaining what's happening and providing historical context. Be reassuring but factual. Don't use technical jargon. Don't say "don't panic" or similar - just be calm and informative.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

export interface EarthquakeExplanationInput {
  earthquake: Earthquake;
  userCity?: string;
  distanceFromUser?: number;
}

export async function generateEarthquakeExplanation(input: EarthquakeExplanationInput): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  
  const region = getRegionById(input.earthquake.region);
  
  const prompt = `You are a seismologist explaining a single earthquake to a local resident. Be brief and informative.

Earthquake details:
- Magnitude: M${input.earthquake.magnitude.toFixed(1)}
- Location: ${input.earthquake.place}
- Depth: ${input.earthquake.depth.toFixed(0)} km
- Region: ${region?.name || 'Unknown'}
- Fault: ${region?.faultLine || 'Unknown'}
${input.userCity ? `- User's city: ${input.userCity}` : ''}
${input.distanceFromUser ? `- Distance from user: ${input.distanceFromUser.toFixed(1)} miles` : ''}

Write 1-2 sentences explaining what this earthquake means for a local resident. Include whether they likely felt it based on magnitude and distance. Be conversational and helpful.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

// Cache for summaries to avoid repeated API calls
const summaryCache = new Map<string, { summary: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedActivitySummary(input: ActivitySummaryInput): Promise<string | null> {
  const cacheKey = `${input.regionId}-${input.currentCount}-${input.multiplier.toFixed(1)}`;
  
  const cached = summaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.summary;
  }
  
  const summary = await generateActivitySummary(input);
  if (summary) {
    summaryCache.set(cacheKey, { summary, timestamp: Date.now() });
  }
  
  return summary;
}

