import type { APIRoute } from 'astro';
import { likeComment } from '@/lib/d1';

// POST /api/comments/like/:commentId
export const POST: APIRoute = async ({ locals, params }) => {
  const { env } = locals.runtime;
  const { commentId } = params;

  if (!commentId) {
    return Response.json({ error: 'commentId is required' }, { status: 400 });
  }

  await likeComment(env.DB, commentId);
  return Response.json({ success: true });
};
