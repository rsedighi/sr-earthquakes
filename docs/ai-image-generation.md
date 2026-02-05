# AI Image Generation System for Bay Tremor

## Overview

Bay Tremor now includes an AI-powered image generation system that creates realistic, contextual images for earthquake news articles using OpenAI's GPT-4o native image generation (`gpt-image-1` model).

### Key Features

- **Time-Aware**: Images reflect the actual time of day when the earthquake occurred (dawn, morning, afternoon, dusk, evening, night)
- **Weather-Contextualized**: Considers Bay Area's unique microclimates (famous fog, seasonal patterns)
- **Location-Specific**: Uses city-specific visual elements, landmarks, and architectural styles
- **Magnitude-Sensitive**: Breaking news images for significant earthquakes include subtle visual cues of seismic activity
- **Category-Styled**: Different visual treatments for breaking news vs. monthly reports vs. swarm alerts

---

## Architecture

### Files

```
lib/
├── image-prompts.ts       # Core prompt generation logic
└── openai.ts              # OpenAI client (existing)

app/api/
└── generate-image/
    └── route.ts           # API endpoint for image generation
```

### BlogPost Interface (Updated)

```typescript
interface BlogPost {
  // ... existing fields ...
  imageContext?: {
    primaryCity: string;      // Main city for the image
    timestamp: number;        // Exact time for lighting/weather
    regionId?: string;        // Fault region
    magnitude?: number;       // For visual intensity
    heroImageUrl?: string;    // Pre-generated image URL
  };
}
```

---

## API Usage

### Generate Image Endpoint

```
POST /api/generate-image
```

#### Request Body

```typescript
{
  type: 'breaking' | 'monthly-report' | 'weekly-roundup' | 'swarm-alert' | 'custom';
  
  // For breaking news
  earthquake?: Earthquake;
  
  // For monthly reports
  year?: number;
  month?: number;
  
  // For weekly roundup
  weekStartDate?: string; // ISO date
  
  // For swarm alerts
  regionId?: string;
  peakMagnitude?: number;
  
  // Common options
  cityName?: string;
  aspectRatio?: '16:9' | '1:1' | '9:16';
  quality?: 'low' | 'medium' | 'high'; // GPT-4o quality options
  dryRun?: boolean; // Returns prompt without generating
}
```

#### Response

```typescript
{
  success: boolean;
  imageUrl?: string;
  prompt?: {
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
  };
  error?: string;
}
```

### Preview Prompts (GET)

```
GET /api/generate-image?type=monthly-report&city=San+Francisco&year=2026&month=1
```

Returns the prompt that would be used without actually generating an image.

---

## Example Prompts

### Breaking News - M4.2 in San Ramon at Night

```
Photorealistic wide shot of San Ramon, California. featuring I-680 corridor 
and corporate headquarters. with Mt. Diablo in background visible. set against 
San Ramon Valley with Mt. Diablo backdrop. during night. clear night sky, stars 
visible, city lights bright against dark sky. mood: urgent, newsworthy, dramatic. 
color palette: high contrast, vivid. subtle tension in the atmosphere, people 
momentarily paused. sense of motion blur, dramatic sky, heightened reality. 
professional editorial photography, sharp details, cinematic composition. shot 
on Sony A7R IV with 24-70mm f/2.8 lens.
```

### Monthly Report - January 2026, San Francisco at Dusk

```
Photorealistic wide shot of San Francisco, California. featuring iconic Victorian 
houses and steep hills. with Golden Gate Bridge visible. set against dramatic hills 
overlooking the San Francisco Bay. during dusk. golden hour magic light, warm orange 
and pink sky, city lights starting. mood: cinematic panoramic establishing shot, 
magazine cover quality. color palette: rich, magazine-quality. cinematic composition, 
premium photography feel. professional editorial photography, sharp details, 
cinematic composition. shot on Sony A7R IV with 24-70mm f/2.8 lens.
```

### Swarm Alert - Calaveras Fault, Morning Fog

```
Photorealistic wide shot of San Ramon, California. featuring I-680 corridor and 
rolling hills. with Bishop Ranch visible. set against San Ramon Valley with 
Mt. Diablo backdrop. during morning. luminous fog softening all details, 
mysterious atmosphere, Karl the Fog. mood: geological tension, earth awareness, 
alert but not panic. color palette: amber and orange undertones. noticeable sense 
of alert. subtle vibration effect, alert feeling. professional editorial photography.
```

---

## Lighting Conditions by Time

| Time of Day | Clear | Foggy | Rainy |
|-------------|-------|-------|-------|
| Dawn | Golden light breaking over eastern hills | Ethereal mist glowing gold | Grey dawn, wet surfaces |
| Morning | Bright, crisp clean light | Luminous fog, Karl the Fog | Dark grey, wet streets |
| Midday | Strong contrast, short shadows | Bright white fog | Dark dramatic skies |
| Afternoon | Warm golden hour approaching | Fog rolling in from coast | Steady rain, moody grey |
| Dusk | Magic hour, orange/pink sky | Fog glowing pink/orange | Blue hour, city reflections |
| Evening | Blue hour, twinkling lights | Fog glowing from city lights | Neon reflections, noir |
| Night | Stars visible, bright city lights | Mysterious fog-shrouded city | Wet streets, streetlight halos |

---

## City Visual Profiles

### San Francisco
- **Elements**: Victorian houses, steep hills, cable cars, bay views
- **Landmarks**: Golden Gate Bridge, Transamerica Pyramid, Coit Tower
- **Style**: Mix of Victorian, Edwardian, modern glass towers
- **Atmosphere**: Urban sophistication with natural beauty

### Oakland
- **Elements**: Diverse urban landscape, port cranes, Lake Merritt
- **Landmarks**: Jack London Square, Fox Theater, Tribune Tower
- **Style**: Industrial converted to hip, Art Deco downtown
- **Atmosphere**: Gritty authenticity, creative energy

### San Ramon
- **Elements**: I-680 corridor, corporate HQs, Iron Horse Trail
- **Landmarks**: Bishop Ranch, Mt. Diablo backdrop
- **Style**: Modern corporate campuses, upscale suburban
- **Atmosphere**: Affluent business park community

---

## Integration with Blog Posts

The blog generator now automatically includes `imageContext` for each post:

```typescript
// Breaking news
imageContext: {
  primaryCity: city,
  timestamp: earthquake.timestamp,
  regionId: earthquake.region,
  magnitude: earthquake.magnitude,
}

// Monthly report
imageContext: {
  primaryCity: topCity,
  timestamp: new Date(year, month, 15, 14, 0, 0).getTime(),
  magnitude: maxMag,
}
```

### Hero Image Display

The blog detail page shows:
1. **If `heroImageUrl` exists**: Full hero image with "AI Generated" badge
2. **Otherwise**: Contextual gradient background showing:
   - Time of day (with emoji)
   - Weather conditions
   - Season
   - City name
   - Magnitude (if significant)

---

## Generating Images

### Manually via API

```bash
# Preview prompt only
curl "http://localhost:3000/api/generate-image?type=monthly-report&city=San%20Francisco&year=2026&month=1"

# Generate actual image
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "type": "monthly-report",
    "year": 2026,
    "month": 0,
    "cityName": "San Francisco",
    "aspectRatio": "16:9",
    "quality": "high"
  }'
```

### Programmatically

```typescript
import { generateMonthlyReportPrompt } from '@/lib/image-prompts';

const prompt = generateMonthlyReportPrompt(2026, 0, 'San Francisco');
console.log(prompt.prompt);
// Use with GPT-4o image generation API
```

---

## Cost Considerations

- **GPT-4o Low Quality (1024x1024)**: More economical for drafts
- **GPT-4o Medium Quality (1024x1024)**: Good balance of quality and cost
- **GPT-4o High Quality (1536x1024)**: Best for hero images

### Recommendations

1. Generate hero images for featured articles only
2. Use medium quality for weekly roundups
3. Use high quality for monthly reports and breaking news
4. Cache generated images (store URLs in database)
5. Consider pre-generating images for major cities

---

## Future Enhancements

1. **Image Caching**: Store generated images in cloud storage with metadata
2. **Batch Generation**: Pre-generate city library for common scenarios
3. **Weather API Integration**: Use real-time weather instead of estimates
4. **A/B Testing**: Compare engagement with AI images vs. gradients
5. **Custom Styles**: Allow users to select preferred visual style
