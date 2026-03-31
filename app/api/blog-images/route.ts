import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  generateBreakingNewsPrompt,
  generateMonthlyReportPrompt,
  generateWeeklyRoundupPrompt,
  generateSwarmAlertPrompt,
  generateImagePrompt,
  GeneratedPrompt
} from '@/lib/image-prompts';
import { getBlogImage, saveBlogImage, getBlogImagesBySlugs } from '@/lib/mongodb';
import { uploadBase64Image } from '@/lib/cloudinary';
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

interface GenerateImageRequest {
  slug: string;
  category: 'breaking' | 'swarm-alert' | 'weekly-roundup' | 'monthly-report' | 'analysis';
  city: string;
  timestamp: number;
  magnitude?: number;
  regionId?: string;
  force?: boolean; // Force regeneration even if image exists
}

/**
 * GET - Fetch existing blog image(s)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const slugs = searchParams.get('slugs'); // Comma-separated for batch

  if (slugs) {
    // Batch fetch
    const slugArray = slugs.split(',').map(s => s.trim());
    const images = await getBlogImagesBySlugs(slugArray);
    
    const result: Record<string, { imageUrl: string; city: string } | null> = {};
    for (const s of slugArray) {
      const img = images.get(s);
      result[s] = img ? { imageUrl: img.imageUrl, city: img.city } : null;
    }
    
    return NextResponse.json({ success: true, images: result });
  }

  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'Slug parameter required' },
      { status: 400 }
    );
  }

  const image = await getBlogImage(slug);
  
  if (!image) {
    return NextResponse.json({ success: true, image: null });
  }

  return NextResponse.json({ 
    success: true, 
    image: {
      imageUrl: image.imageUrl,
      city: image.city,
      timeOfDay: image.timeOfDay,
      weather: image.weather,
      season: image.season,
      magnitude: image.magnitude,
    }
  });
}

/**
 * POST - Generate and save a blog image
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: GenerateImageRequest = await request.json();
    const { slug, category, city, timestamp, magnitude, regionId, force } = body;

    if (!slug || !category || !city) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: slug, category, city' },
        { status: 400 }
      );
    }

    // Check if image already exists (unless force regeneration)
    if (!force) {
      const existing = await getBlogImage(slug);
      if (existing) {
        return NextResponse.json({
          success: true,
          cached: true,
          image: {
            imageUrl: existing.imageUrl,
            city: existing.city,
            timeOfDay: existing.timeOfDay,
            weather: existing.weather,
            season: existing.season,
          }
        });
      }
    }

    // Get OpenAI client
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API not configured' },
        { status: 500 }
      );
    }

    // Generate the appropriate prompt
    let generatedPrompt: GeneratedPrompt;
    
    switch (category) {
      case 'breaking':
        const mockEarthquake: Earthquake = {
          id: slug,
          magnitude: magnitude || 3.5,
          place: city,
          time: new Date(timestamp),
          timestamp: timestamp,
          latitude: 37.7749,
          longitude: -122.4194,
          depth: 10,
          felt: null,
          significance: 100,
          url: '',
          region: regionId || 'san-francisco',
        };
        generatedPrompt = generateBreakingNewsPrompt(mockEarthquake);
        break;
        
      case 'monthly-report':
        const reportDate = new Date(timestamp);
        generatedPrompt = generateMonthlyReportPrompt(
          reportDate.getFullYear(), 
          reportDate.getMonth(), 
          city
        );
        break;
        
      case 'weekly-roundup':
        generatedPrompt = generateWeeklyRoundupPrompt(new Date(timestamp), city);
        break;
        
      case 'swarm-alert':
        generatedPrompt = generateSwarmAlertPrompt(regionId || 'san-ramon', magnitude || 3.5);
        break;
        
      default:
        generatedPrompt = generateImagePrompt({
          timestamp,
          cityName: city,
          articleType: category,
          includeSeismicHint: false,
        });
    }

    // Generate image with GPT-4o
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: generatedPrompt.prompt,
      n: 1,
      size: '1536x1024', // Landscape for hero images
      quality: 'medium',
    });

    const imageData = response.data?.[0];
    
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // Get the base64 data from OpenAI
    const base64Data = imageData.b64_json;
    
    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: 'No image data returned' },
        { status: 500 }
      );
    }

    // Upload to Cloudinary for fast CDN delivery
    console.log(`Uploading image for ${slug} to Cloudinary...`);
    const cloudinaryResult = await uploadBase64Image(base64Data, {
      folder: 'blog-images',
      publicId: slug,
      tags: ['blog', 'earthquake', category, city.toLowerCase().replace(/\s+/g, '-')],
    });

    if (!cloudinaryResult.success || !cloudinaryResult.url) {
      console.error('Cloudinary upload failed:', cloudinaryResult.error);
      return NextResponse.json(
        { success: false, error: 'Image generated but CDN upload failed. Please retry.' },
        { status: 502 }
      );
    }

    const imageUrl = cloudinaryResult.url;
    const generationTime = Date.now() - startTime;

    console.log(`Image uploaded to Cloudinary: ${imageUrl}`);

    // Save Cloudinary URL to database (no base64 stored!)
    const savedImage = await saveBlogImage({
      slug,
      imageUrl,
      cloudinaryPublicId: cloudinaryResult.publicId,
      prompt: generatedPrompt.prompt,
      city: generatedPrompt.metadata.city,
      timeOfDay: generatedPrompt.metadata.timeOfDay,
      weather: generatedPrompt.metadata.weather,
      season: generatedPrompt.metadata.season,
      magnitude: generatedPrompt.metadata.magnitude,
      category,
      generationTime,
    });

    if (!savedImage) {
      // Image uploaded but failed to save to DB - still return the Cloudinary URL
      console.error('Failed to save blog image to database');
      return NextResponse.json({
        success: true,
        cached: false,
        saveError: true,
        image: {
          imageUrl,
          city: generatedPrompt.metadata.city,
          timeOfDay: generatedPrompt.metadata.timeOfDay,
          weather: generatedPrompt.metadata.weather,
          season: generatedPrompt.metadata.season,
        },
        generationTime,
      });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      image: {
        imageUrl: savedImage.imageUrl,
        city: savedImage.city,
        timeOfDay: savedImage.timeOfDay,
        weather: savedImage.weather,
        season: savedImage.season,
      },
      generationTime,
    });

  } catch (error) {
    console.error('Blog image generation error:', error);
    
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
