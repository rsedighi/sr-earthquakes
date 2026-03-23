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
import { saveBlogImage, getBlogImagesBySlugs } from '@/lib/mongodb';
import { uploadBase64Image } from '@/lib/cloudinary';
import { loadAllEarthquakes } from '@/lib/server-data';
import { getAllBlogPosts, BlogPost } from '@/lib/blog-generator';
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

/**
 * Generate image for a single blog post
 */
async function generateImageForPost(
  openai: OpenAI,
  post: BlogPost
): Promise<{ success: boolean; slug: string; error?: string; generationTime?: number; imageUrl?: string }> {
  const startTime = Date.now();
  
  try {
    // Generate the appropriate prompt based on category
    let generatedPrompt: GeneratedPrompt;
    const city = post.imageContext?.primaryCity || post.affectedCities?.[0] || 'Bay Area';
    const timestamp = post.imageContext?.timestamp || post.date.getTime();
    
    switch (post.category) {
      case 'breaking':
        const mockEarthquake: Earthquake = {
          id: post.slug,
          magnitude: post.maxMagnitude || 3.5,
          place: city,
          time: post.date,
          timestamp: timestamp,
          latitude: 37.7749,
          longitude: -122.4194,
          depth: 10,
          felt: null,
          significance: 100,
          url: '',
          region: post.imageContext?.regionId || 'san-francisco',
        };
        generatedPrompt = generateBreakingNewsPrompt(mockEarthquake);
        break;
        
      case 'monthly-report':
        generatedPrompt = generateMonthlyReportPrompt(
          post.date.getFullYear(), 
          post.date.getMonth(), 
          city
        );
        break;
        
      case 'weekly-roundup':
        generatedPrompt = generateWeeklyRoundupPrompt(post.date, city);
        break;
        
      case 'swarm-alert':
        generatedPrompt = generateSwarmAlertPrompt(
          post.imageContext?.regionId || 'san-ramon', 
          post.maxMagnitude || 3.5
        );
        break;
        
      default:
        generatedPrompt = generateImagePrompt({
          timestamp,
          cityName: city,
          articleType: post.category,
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
      return { success: false, slug: post.slug, error: 'No image generated' };
    }

    // Get the base64 data
    const base64Data = imageData.b64_json;
    
    if (!base64Data) {
      return { success: false, slug: post.slug, error: 'No image data returned' };
    }

    // Upload to Cloudinary for fast CDN delivery
    console.log(`Uploading ${post.slug} to Cloudinary...`);
    const cloudinaryResult = await uploadBase64Image(base64Data, {
      folder: 'blog-images',
      publicId: post.slug,
      tags: ['blog', 'earthquake', post.category, city.toLowerCase().replace(/\s+/g, '-')],
    });

    if (!cloudinaryResult.success || !cloudinaryResult.url) {
      return { 
        success: false, 
        slug: post.slug, 
        error: `Cloudinary upload failed: ${cloudinaryResult.error}` 
      };
    }

    const imageUrl = cloudinaryResult.url;
    const generationTime = Date.now() - startTime;

    console.log(`✓ ${post.slug} uploaded to Cloudinary: ${imageUrl}`);

    // Save Cloudinary URL to database
    await saveBlogImage({
      slug: post.slug,
      imageUrl,
      cloudinaryPublicId: cloudinaryResult.publicId,
      prompt: generatedPrompt.prompt,
      city: generatedPrompt.metadata.city,
      timeOfDay: generatedPrompt.metadata.timeOfDay,
      weather: generatedPrompt.metadata.weather,
      season: generatedPrompt.metadata.season,
      magnitude: generatedPrompt.metadata.magnitude,
      category: post.category,
      generationTime,
    });

    return { success: true, slug: post.slug, generationTime, imageUrl };

  } catch (error) {
    console.error(`Error generating image for ${post.slug}:`, error);
    return { 
      success: false, 
      slug: post.slug, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * GET - Get status of all blog images
 */
export async function GET(): Promise<NextResponse> {
  try {
    const earthquakes = await loadAllEarthquakes();
    const allPosts = getAllBlogPosts(earthquakes);
    
    // Get all existing images
    const slugs = allPosts.map(p => p.slug);
    const existingImages = await getBlogImagesBySlugs(slugs);
    
    const postsWithImages = allPosts.filter(p => existingImages.has(p.slug));
    const postsWithoutImages = allPosts.filter(p => !existingImages.has(p.slug));
    
    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: allPosts.length,
        withImages: postsWithImages.length,
        withoutImages: postsWithoutImages.length,
        percentComplete: Math.round((postsWithImages.length / allPosts.length) * 100),
      },
      postsNeedingImages: postsWithoutImages.map(p => ({
        slug: p.slug,
        title: p.title,
        category: p.category,
      })),
    });
  } catch (error) {
    console.error('Error checking blog images status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate images for all posts that don't have one
 * 
 * Body options:
 * - limit: number - Max posts to process (default: 10)
 * - category: string - Only process posts of this category
 * - force: boolean - Regenerate even if image exists
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10; // Default to 10 at a time to avoid timeouts
    const categoryFilter = body.category;
    const force = body.force || false;
    
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API not configured. Add OPENAI_API_KEY to environment.' },
        { status: 500 }
      );
    }
    
    const earthquakes = await loadAllEarthquakes();
    let allPosts = getAllBlogPosts(earthquakes);
    
    // Filter by category if specified
    if (categoryFilter) {
      allPosts = allPosts.filter(p => p.category === categoryFilter);
    }
    
    // Get existing images
    const slugs = allPosts.map(p => p.slug);
    const existingImages = await getBlogImagesBySlugs(slugs);
    
    // Filter to posts that need images
    let postsToProcess = force 
      ? allPosts 
      : allPosts.filter(p => !existingImages.has(p.slug));
    
    // Apply limit
    postsToProcess = postsToProcess.slice(0, limit);
    
    if (postsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All posts already have images!',
        processed: 0,
        results: [],
      });
    }
    
    console.log(`Generating images for ${postsToProcess.length} posts...`);
    
    // Process posts sequentially to avoid rate limits
    const results: Array<{ slug: string; success: boolean; error?: string; generationTime?: number; imageUrl?: string }> = [];
    
    for (const post of postsToProcess) {
      console.log(`Generating image for: ${post.slug}`);
      const result = await generateImageForPost(openai, post);
      results.push(result);
      
      // Small delay between requests to avoid rate limits
      if (postsToProcess.indexOf(post) < postsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Get updated counts
    const updatedImages = await getBlogImagesBySlugs(slugs);
    const remainingPosts = allPosts.filter(p => !updatedImages.has(p.slug));
    
    return NextResponse.json({
      success: true,
      message: `Generated ${successful} images, ${failed} failed`,
      processed: results.length,
      successful,
      failed,
      remainingCount: remainingPosts.length,
      results,
    });
    
  } catch (error) {
    console.error('Error in batch image generation:', error);
    return NextResponse.json(
      { success: false, error: 'Batch generation failed' },
      { status: 500 }
    );
  }
}
