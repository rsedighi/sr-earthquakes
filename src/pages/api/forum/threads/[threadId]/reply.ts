import type { APIRoute } from 'astro';
import { createForumPost, getForumThread } from '@/lib/d1';

// POST /api/forum/threads/:threadId/reply
export const POST: APIRoute = async ({ request, locals, params }) => {
  const { env } = locals.runtime;
  const { threadId } = params;

  if (!threadId) {
    return Response.json({ error: 'threadId is required' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { author, content, authorLocation, parentPostId, feltIt, intensity } = body as Record<string, unknown>;

  if (!author || !content) {
    return Response.json({ error: 'author and content are required' }, { status: 400 });
  }
  if (typeof author  === 'string' && author.length  > 50)    return Response.json({ error: 'Author name too long (max 50 chars)' },   { status: 400 });
  if (typeof content === 'string' && content.length > 10000) return Response.json({ error: 'Content too long (max 10000 chars)' }, { status: 400 });

  try {
    const thread = await getForumThread(env.DB, threadId);
    if (!thread) return Response.json({ error: 'Thread not found' }, { status: 404 });
    if (thread.isLocked) return Response.json({ error: 'Thread is locked' }, { status: 403 });

    const post = await createForumPost(env.DB, {
      threadId,
      parentPostId: parentPostId as string | undefined,
      author:       (author  as string).trim(),
      authorLocation: (authorLocation as string | undefined)?.trim(),
      content:      (content as string).trim(),
      feltIt:       typeof feltIt === 'boolean' ? feltIt : undefined,
      intensity:    typeof intensity === 'number' ? intensity : undefined,
    });

    return Response.json({ post }, { status: 201 });
  } catch (err) {
    console.error('[api/forum/threads/:id/reply POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
