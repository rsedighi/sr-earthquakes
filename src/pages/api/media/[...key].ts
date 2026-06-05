/**
 * GET  /api/media/{folder}/{id}/{filename}   — serve object from R2
 * DELETE /api/media/{folder}/{id}/{filename} — remove object from R2
 *
 * The catch-all [...key] param reassembles the full R2 object key.
 */
import type { APIRoute } from 'astro';
import { getMedia, deleteMedia } from '@/lib/r2';

export const GET: APIRoute = async ({ params, locals }) => {
  const { env } = locals.runtime;

  if (!env.MEDIA_R2) {
    return new Response('Media storage not configured', { status: 503 });
  }

  const key = params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const object = await getMedia(env.MEDIA_R2, key);
  if (!object) return new Response('Not found', { status: 404 });

  const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';

  return new Response(object.body, {
    headers: {
      'Content-Type':  contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag':          object.httpEtag,
    },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { env } = locals.runtime;

  if (!env.MEDIA_R2) {
    return Response.json({ error: 'Media storage not configured' }, { status: 503 });
  }

  const key = params.key;
  if (!key) return Response.json({ error: 'key is required' }, { status: 400 });

  const ok = await deleteMedia(env.MEDIA_R2, key);
  return ok
    ? Response.json({ deleted: true })
    : Response.json({ error: 'Delete failed' }, { status: 500 });
};
