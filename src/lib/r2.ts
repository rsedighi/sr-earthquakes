/**
 * R2 media helpers — replaces lib/cloudinary.ts
 *
 * Key schema:  {folder}/{id}.{ext}
 *   e.g.  hero-images/us7000abcd/1717612800000.webp
 *         forum-attachments/thread-xyz/1717612800001.jpg
 *
 * Public URL:  /api/media/{key}  (proxied via the serve endpoint)
 * All operations accept the R2Bucket binding from Astro.locals.runtime.env.MEDIA_R2
 */

export const MEDIA_BASE_PATH = '/api/media';

// ── Key builder ───────────────────────────────────────────────────────────────

export function buildMediaKey(
  folder: 'hero-images' | 'forum-attachments' | 'profile-avatars',
  id: string,
  ext: string,
): string {
  return `${folder}/${id}/${Date.now()}.${ext.replace(/^\./, '')}`;
}

export function mediaUrl(key: string): string {
  return `${MEDIA_BASE_PATH}/${key}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export async function uploadMedia(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer | ReadableStream | Blob,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<UploadResult> {
  try {
    await bucket.put(key, body, {
      httpMetadata: { contentType },
      customMetadata: metadata,
    });
    return { success: true, key, url: mediaUrl(key) };
  } catch (err) {
    console.error('[r2] upload error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

export async function getMedia(
  bucket: R2Bucket,
  key: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteMedia(bucket: R2Bucket, key: string): Promise<boolean> {
  try {
    await bucket.delete(key);
    return true;
  } catch (err) {
    console.error('[r2] delete error:', err);
    return false;
  }
}

// ── List (admin) ──────────────────────────────────────────────────────────────

export async function listMedia(
  bucket: R2Bucket,
  prefix?: string,
  limit = 100,
): Promise<{ key: string; size: number; uploaded: Date }[]> {
  const result = await bucket.list({ prefix, limit });
  return result.objects.map((o) => ({
    key:      o.key,
    size:     o.size,
    uploaded: o.uploaded,
  }));
}

// ── MIME type helpers ─────────────────────────────────────────────────────────

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg':    'jpg',
  'image/jpg':     'jpg',
  'image/png':     'png',
  'image/webp':    'webp',
  'image/gif':     'gif',
  'image/svg+xml': 'svg',
};

export function getAllowedExtension(mimeType: string): string | null {
  return ALLOWED_TYPES[mimeType.toLowerCase()] ?? null;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
