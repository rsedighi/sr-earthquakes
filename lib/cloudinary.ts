import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'baytremor',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload a base64 image to Cloudinary
 */
export async function uploadBase64Image(
  base64Data: string,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Ensure the base64 string has the data URI prefix
    const dataUri = base64Data.startsWith('data:')
      ? base64Data
      : `data:image/png;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: options.folder || 'blog-images',
      public_id: options.publicId,
      tags: options.tags || ['blog', 'earthquake', 'hero'],
      resource_type: 'image',
      transformation: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload an image from URL to Cloudinary
 */
export async function uploadFromUrl(
  imageUrl: string,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: options.folder || 'blog-images',
      public_id: options.publicId,
      tags: options.tags || ['blog', 'earthquake', 'hero'],
      resource_type: 'image',
      transformation: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get optimized URL for different sizes
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  } = {}
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });
}

export default cloudinary;
