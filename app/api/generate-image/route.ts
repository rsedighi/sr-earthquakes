import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  generateImagePrompt, 
  generateBreakingNewsPrompt,
  generateMonthlyReportPrompt,
  generateWeeklyRoundupPrompt,
  generateSwarmAlertPrompt,
  ArticleType,
  ImagePromptConfig,
  GeneratedPrompt
} from '@/lib/image-prompts';
import { Earthquake } from '@/lib/types';

// Initialize OpenAI client
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not found. Image generation disabled.');
    return null;
  }
  return new OpenAI({ apiKey });
}

// Image size options for GPT-4o image generation
type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

interface GenerateImageRequest {
  type: 'breaking' | 'monthly-report' | 'weekly-roundup' | 'swarm-alert' | 'custom';
  
  // For breaking news
  earthquake?: Earthquake;
  
  // For monthly reports
  year?: number;
  month?: number;
  
  // For weekly roundup
  weekStartDate?: string; // ISO date string
  
  // For swarm alerts
  regionId?: string;
  peakMagnitude?: number;
  
  // For custom prompts
  customConfig?: ImagePromptConfig;
  
  // Common options
  cityName?: string;
  aspectRatio?: '16:9' | '1:1' | '9:16';
  quality?: 'low' | 'medium' | 'high'; // GPT-4o quality options
  
  // Debug mode - just return the prompt without generating
  dryRun?: boolean;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  prompt?: GeneratedPrompt;
  error?: string;
}

/**
 * Map aspect ratio to GPT-4o image size
 */
function getImageSize(aspectRatio?: '16:9' | '1:1' | '9:16'): ImageSize {
  switch (aspectRatio) {
    case '16:9':
      return '1536x1024'; // Landscape (GPT-4o native)
    case '9:16':
      return '1024x1536'; // Portrait (GPT-4o native)
    case '1:1':
    default:
      return '1024x1024'; // Square
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateImageResponse>> {
  try {
    const body: GenerateImageRequest = await request.json();
    
    // Generate the appropriate prompt based on type
    let generatedPrompt: GeneratedPrompt;
    
    switch (body.type) {
      case 'breaking':
        if (!body.earthquake) {
          return NextResponse.json(
            { success: false, error: 'Earthquake data required for breaking news image' },
            { status: 400 }
          );
        }
        generatedPrompt = generateBreakingNewsPrompt(body.earthquake);
        break;
        
      case 'monthly-report':
        if (body.year === undefined || body.month === undefined) {
          return NextResponse.json(
            { success: false, error: 'Year and month required for monthly report image' },
            { status: 400 }
          );
        }
        generatedPrompt = generateMonthlyReportPrompt(body.year, body.month, body.cityName);
        break;
        
      case 'weekly-roundup':
        const weekDate = body.weekStartDate ? new Date(body.weekStartDate) : new Date();
        generatedPrompt = generateWeeklyRoundupPrompt(weekDate, body.cityName);
        break;
        
      case 'swarm-alert':
        if (!body.regionId || body.peakMagnitude === undefined) {
          return NextResponse.json(
            { success: false, error: 'Region ID and peak magnitude required for swarm alert image' },
            { status: 400 }
          );
        }
        generatedPrompt = generateSwarmAlertPrompt(body.regionId, body.peakMagnitude);
        break;
        
      case 'custom':
        if (!body.customConfig) {
          return NextResponse.json(
            { success: false, error: 'Custom config required for custom image generation' },
            { status: 400 }
          );
        }
        generatedPrompt = generateImagePrompt(body.customConfig);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid image type' },
          { status: 400 }
        );
    }
    
    // If dry run, just return the prompt
    if (body.dryRun) {
      return NextResponse.json({
        success: true,
        prompt: generatedPrompt,
      });
    }
    
    // Generate the actual image
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }
    
    const imageSize = getImageSize(body.aspectRatio);
    const quality = body.quality || 'medium';
    
    // Use GPT-4o native image generation (gpt-image-1)
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: generatedPrompt.prompt,
      n: 1,
      size: imageSize,
      quality: quality as 'low' | 'medium' | 'high',
    });
    
    // GPT-4o returns base64 encoded images by default
    const imageData = response.data?.[0];
    
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data returned from GPT-4o' },
        { status: 500 }
      );
    }
    
    // Return either URL or base64 data
    const imageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image URL or data returned from GPT-4o' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: generatedPrompt,
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        return NextResponse.json(
          { success: false, error: 'Content policy violation or invalid prompt' },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to preview prompts without generating images
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') as ArticleType | null;
  const city = searchParams.get('city') || 'San Francisco';
  
  if (!type) {
    return NextResponse.json(
      { error: 'Type parameter required' },
      { status: 400 }
    );
  }
  
  let prompt: GeneratedPrompt;
  
  switch (type) {
    case 'monthly-report':
      const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
      const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
      prompt = generateMonthlyReportPrompt(year, month, city);
      break;
      
    case 'weekly-roundup':
      prompt = generateWeeklyRoundupPrompt(new Date(), city);
      break;
      
    case 'swarm-alert':
      const regionId = searchParams.get('regionId') || 'san-ramon';
      const magnitude = parseFloat(searchParams.get('magnitude') || '3.5');
      prompt = generateSwarmAlertPrompt(regionId, magnitude);
      break;
      
    default:
      prompt = generateImagePrompt({
        cityName: city,
        articleType: type,
        includeSeismicHint: false,
      });
  }
  
  return NextResponse.json({
    type,
    city,
    prompt,
    usage: {
      endpoint: 'POST /api/generate-image',
      note: 'Use POST with dryRun:false to actually generate the image',
    },
  });
}
