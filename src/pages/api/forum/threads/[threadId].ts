import type { APIRoute } from 'astro';
import { getForumThread, getForumPosts } from '@/lib/d1';

// GET /api/forum/threads/:threadId
// ?posts=true  to include posts in the same request
export const GET: APIRoute = async ({ request, locals, params }) => {
  const { env } = locals.runtime;
  const { threadId } = params;

  if (!threadId) {
    return Response.json({ error: 'threadId is required' }, { status: 400 });
  }

  try {
    const thread = await getForumThread(env.DB, threadId, true);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const includePosts = new URL(request.url).searchParams.get('posts') === 'true';
    if (includePosts) {
      const { posts, total } = await getForumPosts(env.DB, thread.id);
      return Response.json({ thread, posts, total });
    }

    return Response.json({ thread });
  } catch (err) {
    console.error('[api/forum/threads/:id GET]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
