/**
 * POST /api/media/upload
 *
 * Accepts multipart/form-data with:
 *   file     — the image file (required)
 *   folder   — 'hero-images' | 'forum-attachments' | 'profile-avatars' (optional, default: hero-images)
 *   id       — grouping id, e.g. earthquake id or thread id (optional, default: random)
 *
 * Returns: { key, url }
 */
import type { APIRoute } from 'astro';
import {
  uploadMedia,
  buildMediaKey,
  getAllowedExtension,
  MAX_UPLOAD_BYTES,
} from '@/lib/r2';

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  if (!env.MEDIA_R2) {
    return Response.json({ error: 'Media storage not configured' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'file field is required' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` }, { status: 413 });
  }

  const ext = getAllowedExtension(file.type);
  if (!ext) {
    return Response.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }

  const rawFolder = formData.get('folder')?.toString() ?? 'hero-images';
  const folder = (['hero-images', 'forum-attachments', 'profile-avatars'] as const).includes(
    rawFolder as 'hero-images',
  )
    ? (rawFolder as 'hero-images' | 'forum-attachments' | 'profile-avatars')
    : 'hero-images';

  const id  = formData.get('id')?.toString() ?? crypto.randomUUID();
  const key = buildMediaKey(folder, id, ext);

  const result = await uploadMedia(
    env.MEDIA_R2,
    key,
    await file.arrayBuffer(),
    file.type,
    { originalName: file.name, uploadedAt: new Date().toISOString() },
  );

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ key: result.key, url: result.url }, { status: 201 });
};
