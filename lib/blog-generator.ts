// Automated blog content generation
// Generates blog posts from earthquake data without manual writing

import { Earthquake } from './types';
import { REGIONS, BAY_AREA_LANDMARKS } from './regions';
import { detectSwarms } from './analysis';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: Date;
  category: 'weekly-roundup' | 'monthly-report' | 'breaking' | 'swarm-alert' | 'analysis';
  tags: string[];
  featured: boolean;
  earthquakeCount?: number;
  maxMagnitude?: number;
  affectedCities?: string[];
  // Image generation context
  imageContext?: {
    primaryCity: string;
    timestamp: number;
    regionId?: string;
    magnitude?: number;
    // Pre-generated image URL (if available)
    heroImageUrl?: string;
  };
}

// Format date helpers
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function getWeekRange(date: Date): { start: Date; end: Date; label: string } {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // End of week (Saturday)
  end.setHours(23, 59, 59, 999);
  
  const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  return { start, end, label };
}

function getMonthRange(year: number, month: number): { start: Date; end: Date; label: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return { start, end, label };
}

// Get nearest city for an earthquake
function getNearestCity(lat: number, lon: number): string {
  const cities = BAY_AREA_LANDMARKS.filter(l => l.type === 'city');
  let nearest = cities[0];
  let minDist = Infinity;
  
  for (const city of cities) {
    const dist = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  
  return nearest.name;
}

// Get region name
function getRegionName(regionId: string): string {
  const region = REGIONS.find(r => r.id === regionId);
  return region?.name.split(' / ')[0] || 'Bay Area';
}

// Generate magnitude emoji
function getMagnitudeEmoji(mag: number): string {
  if (mag >= 5.0) return '🚨';
  if (mag >= 4.0) return '⚠️';
  if (mag >= 3.0) return '📢';
  return '📊';
}

// Generate activity level description
function getActivityLevel(count: number, avgForPeriod: number): string {
  const ratio = count / avgForPeriod;
  if (ratio >= 2) return 'significantly above average';
  if (ratio >= 1.5) return 'above average';
  if (ratio >= 0.75) return 'near average';
  if (ratio >= 0.5) return 'below average';
  return 'significantly below average';
}

/**
 * Generate Weekly Roundup Post
 */
export function generateWeeklyRoundup(earthquakes: Earthquake[], weekDate: Date): BlogPost {
  const { start, end, label } = getWeekRange(weekDate);
  
  // Filter earthquakes for this week
  const weekQuakes = earthquakes.filter(eq => 
    eq.timestamp >= start.getTime() && eq.timestamp <= end.getTime()
  );
  
  const count = weekQuakes.length;
  const maxMag = count > 0 ? Math.max(...weekQuakes.map(eq => eq.magnitude)) : 0;
  const avgMag = count > 0 ? weekQuakes.reduce((sum, eq) => sum + eq.magnitude, 0) / count : 0;
  
  // Count by region
  const byRegion: Record<string, number> = {};
  weekQuakes.forEach(eq => {
    byRegion[eq.region] = (byRegion[eq.region] || 0) + 1;
  });
  
  // Get top regions
  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ name: getRegionName(id), count }));
  
  // Get significant quakes (M2.5+)
  const significantQuakes = weekQuakes
    .filter(eq => eq.magnitude >= 2.5)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5);
  
  // Get affected cities
  const affectedCities = [...new Set(weekQuakes.map(eq => getNearestCity(eq.latitude, eq.longitude)))].slice(0, 10);
  
  // Detect swarms this week
  const swarms = detectSwarms(weekQuakes);
  
  // Generate slug
  const slugDate = start.toISOString().split('T')[0];
  const slug = `weekly-roundup-${slugDate}`;
  
  // Generate title
  const title = count > 0 
    ? `Bay Area Earthquake Roundup: ${label} (${count} Earthquakes${maxMag >= 3 ? `, Max M${maxMag.toFixed(1)}` : ''})`
    : `Bay Area Earthquake Roundup: ${label} - Quiet Week`;
  
  // Generate description
  const description = count > 0
    ? `${count} earthquakes recorded in the Bay Area during the week of ${label}. ${maxMag >= 3 ? `Largest was M${maxMag.toFixed(1)}. ` : ''}Complete summary and analysis.`
    : `A quiet week in Bay Area seismic activity. No significant earthquakes recorded during ${label}.`;
  
  // Generate content
  let content = `
## Weekly Summary

The San Francisco Bay Area recorded **${count} earthquakes** during the week of ${label}.

${count > 0 ? `
### Key Statistics

| Metric | Value |
|--------|-------|
| Total Earthquakes | ${count} |
| Largest Magnitude | M${maxMag.toFixed(1)} |
| Average Magnitude | M${avgMag.toFixed(2)} |
| Most Active Region | ${topRegions[0]?.name || 'N/A'} (${topRegions[0]?.count || 0} earthquakes) |

` : `
This was an unusually quiet week for seismic activity in the Bay Area. While this doesn't mean the region is any less seismically active overall, periods of low activity are normal.

`}

${significantQuakes.length > 0 ? `
### Notable Earthquakes

${significantQuakes.map(eq => `
- **M${eq.magnitude.toFixed(1)}** - ${eq.place}  
  ${formatDate(new Date(eq.timestamp))} at ${new Date(eq.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}  
  [View Details →](/earthquake/${eq.id})
`).join('\n')}
` : ''}

${topRegions.length > 0 ? `
### Activity by Region

${topRegions.map(r => `- **${r.name}**: ${r.count} earthquake${r.count !== 1 ? 's' : ''}`).join('\n')}
` : ''}

${swarms.length > 0 ? `
### Swarm Activity

${swarms.length} earthquake swarm${swarms.length !== 1 ? 's were' : ' was'} detected this week:

${swarms.map(s => `- **${getRegionName(s.region)}**: ${s.totalCount} earthquakes (Peak: M${s.peakMagnitude.toFixed(1)})`).join('\n')}

[Learn more about earthquake swarms →](/faq)
` : ''}

---

## What This Means

${count >= 50 ? `
This was an **active week** for the Bay Area. While most earthquakes were too small to feel, the elevated activity is a reminder that we live in one of the most seismically active regions in the United States.
` : count >= 20 ? `
This was a **typical week** for Bay Area seismic activity. The region experiences dozens of small earthquakes weekly, most of which go unnoticed by residents.
` : count > 0 ? `
This was a **relatively quiet week** for the Bay Area. However, seismic activity can change quickly, and residents should always maintain earthquake preparedness.
` : `
While this was an unusually quiet week, the Bay Area's major fault systems remain active. Scientists estimate a 72% probability of a magnitude 6.7 or greater earthquake in the region within the next 30 years.
`}

### Stay Prepared

- Keep your [earthquake emergency kit](/earthquake-preparedness) stocked and accessible
- Know what to do: [Drop, Cover, and Hold On](/earthquake-preparedness#during)
- Report earthquakes you feel: [Did You Feel It?](/felt-earthquake)


`;


  return {
    slug,
    title,
    description,
    content,
    date: end,
    category: 'weekly-roundup',
    tags: ['weekly roundup', 'bay area', 'seismic activity', ...affectedCities.slice(0, 5).map(c => c.toLowerCase())],
    featured: maxMag >= 4.0 || count >= 50,
    earthquakeCount: count,
    maxMagnitude: maxMag,
    affectedCities,
    imageContext: {
      primaryCity: affectedCities[0] || 'San Francisco',
      timestamp: start.getTime(),
      magnitude: maxMag,
    },
  };
}

/**
 * Generate Monthly Report
 */
export function generateMonthlyReport(earthquakes: Earthquake[], year: number, month: number): BlogPost {
  const { start, end, label } = getMonthRange(year, month);
  
  // Filter earthquakes for this month
  const monthQuakes = earthquakes.filter(eq => 
    eq.timestamp >= start.getTime() && eq.timestamp <= end.getTime()
  );
  
  const count = monthQuakes.length;
  const maxMag = count > 0 ? Math.max(...monthQuakes.map(eq => eq.magnitude)) : 0;
  const avgMag = count > 0 ? monthQuakes.reduce((sum, eq) => sum + eq.magnitude, 0) / count : 0;
  
  // Count by magnitude range
  const magRanges = {
    'M0-2': monthQuakes.filter(eq => eq.magnitude < 2).length,
    'M2-3': monthQuakes.filter(eq => eq.magnitude >= 2 && eq.magnitude < 3).length,
    'M3-4': monthQuakes.filter(eq => eq.magnitude >= 3 && eq.magnitude < 4).length,
    'M4+': monthQuakes.filter(eq => eq.magnitude >= 4).length,
  };
  
  // Count by region
  const byRegion: Record<string, number> = {};
  monthQuakes.forEach(eq => {
    byRegion[eq.region] = (byRegion[eq.region] || 0) + 1;
  });
  
  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: getRegionName(id), count }));
  
  // Get felt earthquakes (M3+)
  const feltQuakes = monthQuakes
    .filter(eq => eq.magnitude >= 3)
    .sort((a, b) => b.magnitude - a.magnitude);
  
  // Weekly breakdown
  const weeklyData: { week: string; count: number }[] = [];
  let weekStart = new Date(start);
  while (weekStart < end) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekCount = monthQuakes.filter(eq => 
      eq.timestamp >= weekStart.getTime() && 
      eq.timestamp <= Math.min(weekEnd.getTime(), end.getTime())
    ).length;
    
    weeklyData.push({
      week: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      count: weekCount,
    });
    
    weekStart.setDate(weekStart.getDate() + 7);
  }
  
  // Detect swarms
  const swarms = detectSwarms(monthQuakes);
  
  // Generate slug
  const slugDate = `${year}-${String(month + 1).padStart(2, '0')}`;
  const slug = `monthly-report-${slugDate}`;
  
  const title = `${label} Seismic Activity Report: ${count} Earthquakes${maxMag >= 3.5 ? ` (Max M${maxMag.toFixed(1)})` : ''}`;
  
  const description = `Complete analysis of Bay Area earthquake activity in ${label}. ${count} total earthquakes recorded, ${feltQuakes.length} felt events. Trends, regional breakdown, and safety reminders.`;
  
  let content = `
## ${label} Overview

The San Francisco Bay Area recorded **${count} earthquakes** in ${label}, with magnitudes ranging from ${count > 0 ? `M${Math.min(...monthQuakes.map(eq => eq.magnitude)).toFixed(1)}` : 'N/A'} to **M${maxMag.toFixed(1)}**.

### Monthly Statistics

| Metric | Value |
|--------|-------|
| Total Earthquakes | ${count} |
| Largest Earthquake | M${maxMag.toFixed(1)} |
| Average Magnitude | M${avgMag.toFixed(2)} |
| Felt Earthquakes (M3+) | ${feltQuakes.length} |
| Earthquake Swarms | ${swarms.length} |

### Magnitude Distribution

| Range | Count | Percentage |
|-------|-------|------------|
| M0-2 (Micro) | ${magRanges['M0-2']} | ${count > 0 ? ((magRanges['M0-2'] / count) * 100).toFixed(0) : 0}% |
| M2-3 (Minor) | ${magRanges['M2-3']} | ${count > 0 ? ((magRanges['M2-3'] / count) * 100).toFixed(0) : 0}% |
| M3-4 (Light) | ${magRanges['M3-4']} | ${count > 0 ? ((magRanges['M3-4'] / count) * 100).toFixed(0) : 0}% |
| M4+ (Moderate+) | ${magRanges['M4+']} | ${count > 0 ? ((magRanges['M4+'] / count) * 100).toFixed(0) : 0}% |

---

## Regional Breakdown

${topRegions.length > 0 ? `
| Region | Earthquakes | Share |
|--------|-------------|-------|
${topRegions.map(r => `| ${r.name} | ${r.count} | ${count > 0 ? ((r.count / count) * 100).toFixed(0) : 0}% |`).join('\n')}
` : 'No significant regional activity this month.'}

---

## Weekly Trend

${weeklyData.map(w => `- **Week of ${w.week}**: ${w.count} earthquake${w.count !== 1 ? 's' : ''}`).join('\n')}

---

${feltQuakes.length > 0 ? `
## Felt Earthquakes

These earthquakes were large enough to potentially be felt by residents:

${feltQuakes.slice(0, 10).map(eq => `
### M${eq.magnitude.toFixed(1)} - ${eq.place}
- **Date:** ${formatDate(new Date(eq.timestamp))}
- **Time:** ${new Date(eq.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
- **Depth:** ${eq.depth.toFixed(1)} km
- [View Details →](/earthquake/${eq.id})
`).join('\n')}
` : '## No Felt Earthquakes\n\nNo earthquakes large enough to be widely felt (M3+) occurred this month.'}

${swarms.length > 0 ? `
---

## Swarm Activity

${swarms.length} earthquake swarm${swarms.length !== 1 ? 's were' : ' was'} detected in ${label}:

${swarms.slice(0, 5).map(s => `
- **${getRegionName(s.region)} Swarm**
  - Duration: ${formatShortDate(s.startTime)} - ${formatShortDate(s.endTime)}
  - Total earthquakes: ${s.totalCount}
  - Peak magnitude: M${s.peakMagnitude.toFixed(1)}
`).join('\n')}

Swarms are common in the Bay Area, particularly in the San Ramon/Danville area along the Calaveras Fault. [Learn more about swarms →](/calaveras-fault)
` : ''}

---

## Looking Ahead

The Bay Area sits atop several major fault systems including the San Andreas, Hayward, and Calaveras faults. Scientists estimate a **72% probability** of a magnitude 6.7 or greater earthquake in the region within the next 30 years.

### Stay Prepared

1. **Before**: [Create an earthquake kit](/earthquake-preparedness) and family communication plan
2. **During**: [Drop, Cover, and Hold On](/earthquake-preparedness#during)
3. **After**: Check for injuries, assess damage, and be prepared for aftershocks

[Report felt earthquakes →](/felt-earthquake) | [View live data →](/)


`;


  const affectedCities = [...new Set(monthQuakes.map(eq => getNearestCity(eq.latitude, eq.longitude)))].slice(0, 10);

  return {
    slug,
    title,
    description,
    content,
    date: end,
    category: 'monthly-report',
    tags: ['monthly report', label.toLowerCase(), 'bay area', 'seismic analysis', ...affectedCities.slice(0, 3).map(c => c.toLowerCase())],
    featured: true,
    earthquakeCount: count,
    maxMagnitude: maxMag,
    affectedCities,
    imageContext: {
      primaryCity: topRegions[0]?.name?.split(' / ')[0] || affectedCities[0] || 'San Francisco',
      timestamp: new Date(year, month, 15, 14, 0, 0).getTime(), // Mid-month, afternoon
      magnitude: maxMag,
    },
  };
}

/**
 * Generate Breaking News Post for Significant Earthquake
 */
export function generateBreakingPost(earthquake: Earthquake): BlogPost {
  const date = new Date(earthquake.timestamp);
  const city = getNearestCity(earthquake.latitude, earthquake.longitude);
  const region = getRegionName(earthquake.region);
  const regionData = REGIONS.find(r => r.id === earthquake.region);
  
  const slug = `earthquake-${earthquake.id}`;
  
  const emoji = getMagnitudeEmoji(earthquake.magnitude);
  const title = earthquake.magnitude >= 5.0
    ? `${emoji} BREAKING: M${earthquake.magnitude.toFixed(1)} Earthquake Strikes ${city}`
    : earthquake.magnitude >= 4.0
    ? `${emoji} M${earthquake.magnitude.toFixed(1)} Earthquake Hits ${region} - Felt Across Bay Area`
    : `${emoji} M${earthquake.magnitude.toFixed(1)} Earthquake Near ${city} - Did You Feel It?`;
  
  const description = `A magnitude ${earthquake.magnitude.toFixed(1)} earthquake struck ${earthquake.place} on ${formatDate(date)}. ${earthquake.felt ? `Felt by ${earthquake.felt} people. ` : ''}Full details, community reports, and safety information.`;
  
  let content = `
## Earthquake Details

A **magnitude ${earthquake.magnitude.toFixed(1)}** earthquake struck ${earthquake.place} on ${formatDate(date)} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}.

| Detail | Information |
|--------|-------------|
| Magnitude | **M${earthquake.magnitude.toFixed(1)}** |
| Location | ${earthquake.place} |
| Time | ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} |
| Date | ${formatDate(date)} |
| Depth | ${earthquake.depth.toFixed(1)} km |
| Region | ${region} |
${earthquake.felt ? `| Felt Reports | ${earthquake.felt} |` : ''}

[View detailed earthquake data →](/earthquake/${earthquake.id})

---

## Did You Feel It?

${earthquake.magnitude >= 3.0 ? `
This earthquake was likely felt by residents in ${city} and surrounding areas. The shaking intensity varies based on:

- **Distance from epicenter** - Closer locations experience stronger shaking
- **Soil type** - Soft soils amplify shaking compared to bedrock
- **Building type** - Upper floors of buildings may sway more

[Report what you felt →](/felt-earthquake)
` : `
This was a minor earthquake that most people probably didn't notice. However, sensitive individuals or those very close to the epicenter may have felt slight shaking.
`}

---

## What Caused This Earthquake?

${regionData ? `
This earthquake occurred in the **${region}** area, which sits along the **${regionData.faultLine}**. ${
  regionData.faultLine.includes('Hayward') 
    ? 'The Hayward Fault is considered one of the most dangerous faults in the United States due to its proximity to densely populated cities.'
    : regionData.faultLine.includes('San Andreas')
    ? 'The San Andreas Fault is the primary boundary between the Pacific and North American tectonic plates.'
    : regionData.faultLine.includes('Calaveras')
    ? 'The Calaveras Fault is known for frequent earthquake swarms, particularly in the San Ramon/Danville area.'
    : ''
}

[Learn more about the ${regionData.faultLine} →](/${regionData.faultLine.toLowerCase().replace(/\s+/g, '-')})
` : `
The Bay Area sits at the boundary of the Pacific and North American tectonic plates, making it one of the most seismically active regions in the United States.
`}

---

## Safety Reminders

${earthquake.magnitude >= 4.0 ? `
### Check for Damage

After feeling an earthquake:

1. Check yourself and others for injuries
2. Look for structural damage to your home
3. Check for gas leaks, water damage, and electrical issues
4. Be prepared for aftershocks

### Aftershock Warning

Earthquakes of this magnitude often produce aftershocks. These can occur minutes, hours, or even days after the main event. Stay alert and be prepared to Drop, Cover, and Hold On.
` : `
While this earthquake was relatively small, it's a reminder that the Bay Area is seismically active. Use this as an opportunity to:

- Review your [earthquake preparedness plan](/earthquake-preparedness)
- Check that your emergency kit is stocked
- Know where to take cover if stronger shaking occurs
`}

[Complete Earthquake Preparedness Guide →](/earthquake-preparedness)


`;


  return {
    slug,
    title,
    description,
    content,
    date,
    category: 'breaking',
    tags: [
      'breaking news',
      city.toLowerCase(),
      region.toLowerCase(),
      `magnitude ${Math.floor(earthquake.magnitude)}`,
      regionData?.faultLine?.toLowerCase() || '',
    ].filter(Boolean),
    featured: earthquake.magnitude >= 4.0,
    earthquakeCount: 1,
    maxMagnitude: earthquake.magnitude,
    affectedCities: [city],
    imageContext: {
      primaryCity: city,
      timestamp: earthquake.timestamp,
      regionId: earthquake.region,
      magnitude: earthquake.magnitude,
    },
  };
}

/**
 * Generate Swarm Alert Post
 */
export function generateSwarmPost(earthquakes: Earthquake[], regionId: string): BlogPost | null {
  const regionQuakes = earthquakes.filter(eq => eq.region === regionId);
  const swarms = detectSwarms(regionQuakes);
  
  if (swarms.length === 0) return null;
  
  const latestSwarm = swarms[0];
  const region = getRegionName(regionId);
  const regionData = REGIONS.find(r => r.id === regionId);
  
  // Get all earthquakes in this swarm
  const swarmQuakes = regionQuakes.filter(eq => 
    eq.timestamp >= latestSwarm.startTime.getTime() && 
    eq.timestamp <= latestSwarm.endTime.getTime()
  );
  
  const slug = `swarm-${regionId}-${latestSwarm.startTime.toISOString().split('T')[0]}`;
  
  const title = `⚡ Earthquake Swarm Alert: ${latestSwarm.totalCount} Earthquakes in ${region}`;
  
  const description = `An earthquake swarm with ${latestSwarm.totalCount} events (max M${latestSwarm.peakMagnitude.toFixed(1)}) has been detected in the ${region} area. Live updates and analysis.`;
  
  let content = `
## Swarm Overview

An **earthquake swarm** has been detected in the **${region}** area.

| Swarm Statistics | |
|------------------|---|
| Total Earthquakes | **${latestSwarm.totalCount}** |
| Peak Magnitude | **M${latestSwarm.peakMagnitude.toFixed(1)}** |
| Started | ${formatDate(latestSwarm.startTime)} |
| Duration | ${Math.ceil((latestSwarm.endTime.getTime() - latestSwarm.startTime.getTime()) / (1000 * 60 * 60 * 24))} days |

---

## What is an Earthquake Swarm?

An earthquake swarm is a sequence of many earthquakes occurring in the same area over a relatively short period, without a clear mainshock-aftershock pattern. Unlike typical earthquake sequences, swarms don't have a single large earthquake followed by smaller aftershocks - instead, the earthquakes are more similar in size.

${regionData?.faultLine?.includes('Calaveras') ? `
### The Calaveras Fault Connection

The ${region} area is located along the Calaveras Fault, which is known for producing earthquake swarms. The San Ramon/Danville area experiences noticeable swarm activity every few years. While these swarms can be unsettling, they typically consist of small earthquakes that cause no damage.

[Learn more about the Calaveras Fault →](/calaveras-fault)
` : ''}

---

## Recent Activity

${swarmQuakes.slice(0, 10).map(eq => `
- **M${eq.magnitude.toFixed(1)}** - ${new Date(eq.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
`).join('')}

${swarmQuakes.length > 10 ? `\n*...and ${swarmQuakes.length - 10} more earthquakes*` : ''}

[View all earthquakes in this area →](/region/${regionId})

---

## Should You Be Concerned?

${latestSwarm.peakMagnitude >= 4.0 ? `
**This swarm includes earthquakes large enough to be felt.** While swarms rarely produce damaging earthquakes, the elevated activity is a reminder to:

1. Review your earthquake preparedness plan
2. Secure heavy items that could fall
3. Know where to take cover if larger shaking occurs
` : `
**Most earthquakes in this swarm are too small to feel.** Earthquake swarms are a normal part of seismic activity in the Bay Area and do not necessarily indicate a larger earthquake is coming. However, they're a good reminder to stay prepared.
`}

---

## Stay Updated

- [View live earthquake map →](/)
- [Report felt earthquakes →](/felt-earthquake)
- [Earthquake preparedness guide →](/earthquake-preparedness)


`;


  const city = getNearestCity(swarmQuakes[0].latitude, swarmQuakes[0].longitude);

  return {
    slug,
    title,
    description,
    content,
    date: latestSwarm.endTime,
    category: 'swarm-alert',
    tags: ['earthquake swarm', region.toLowerCase(), city.toLowerCase(), regionData?.faultLine?.toLowerCase() || ''].filter(Boolean),
    featured: latestSwarm.peakMagnitude >= 3.5 || latestSwarm.totalCount >= 50,
    earthquakeCount: latestSwarm.totalCount,
    maxMagnitude: latestSwarm.peakMagnitude,
    affectedCities: [city],
    imageContext: {
      primaryCity: city,
      timestamp: latestSwarm.startTime.getTime(),
      regionId: regionId,
      magnitude: latestSwarm.peakMagnitude,
    },
  };
}

/**
 * Get all auto-generated blog posts
 */
export function getAllBlogPosts(earthquakes: Earthquake[]): BlogPost[] {
  const posts: BlogPost[] = [];
  const now = new Date();
  
  // Generate weekly roundups for the past 12 weeks
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    const post = generateWeeklyRoundup(earthquakes, weekDate);
    if (post.earthquakeCount && post.earthquakeCount > 0) {
      posts.push(post);
    }
  }
  
  // Generate monthly reports for the past 6 months
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now);
    monthDate.setMonth(monthDate.getMonth() - i);
    const post = generateMonthlyReport(earthquakes, monthDate.getFullYear(), monthDate.getMonth());
    if (post.earthquakeCount && post.earthquakeCount > 0) {
      posts.push(post);
    }
  }
  
  // Generate breaking posts for significant recent earthquakes (M3.5+, last 30 days)
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const significantQuakes = earthquakes
    .filter(eq => eq.magnitude >= 3.5 && eq.timestamp > thirtyDaysAgo)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10);
  
  for (const eq of significantQuakes) {
    posts.push(generateBreakingPost(eq));
  }
  
  // Generate swarm alerts for active regions
  const activeRegions = ['san-ramon', 'santa-clara', 'peninsula'];
  for (const regionId of activeRegions) {
    const swarmPost = generateSwarmPost(earthquakes, regionId);
    if (swarmPost) {
      posts.push(swarmPost);
    }
  }
  
  // Sort by date (most recent first) and remove duplicates
  const uniquePosts = posts.reduce((acc, post) => {
    if (!acc.find(p => p.slug === post.slug)) {
      acc.push(post);
    }
    return acc;
  }, [] as BlogPost[]);
  
  return uniquePosts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get a specific blog post by slug
 */
export function getBlogPostBySlug(earthquakes: Earthquake[], slug: string): BlogPost | null {
  const allPosts = getAllBlogPosts(earthquakes);
  return allPosts.find(p => p.slug === slug) || null;
}
