import type { APIRoute } from 'astro';
import {
  getForumThreads,
  createForumThread,
  getTrendingThreads,
  searchForumThreads,
  getForumStats,
  type ForumCategory,
} from '@/lib/d1';

const VALID_CATEGORIES: ForumCategory[] = ['earthquake', 'general', 'neighborhood', 'preparedness', 'science'];

// GET /api/forum/threads
// ?category=  &earthquakeId=  &limit=  &skip=  &sortBy=  &search=  &trending=true  &stats=true
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const p = new URL(request.url).searchParams;

  const category    = p.get('category') as ForumCategory | null;
  const earthquakeId = p.get('earthquakeId');
  const limit       = Math.min(parseInt(p.get('limit') || '20'), 100);
  const skip        = parseInt(p.get('skip') || '0');
  const sortBy      = (p.get('sortBy') || 'latest') as 'latest' | 'popular' | 'active';
  const search      = p.get('search');
  const trending    = p.get('trending') === 'true';
  const stats       = p.get('stats') === 'true';

  try {
    if (stats) {
      return Response.json({ stats: await getForumStats(env.DB) });
    }
    if (trending) {
      return Response.json({ threads: await getTrendingThreads(env.DB, limit) });
    }
    if (search) {
      return Response.json({ threads: await searchForumThreads(env.DB, search, { category: category ?? undefined, limit }) });
    }

    const result = await getForumThreads(env.DB, {
      category: category ?? undefined,
      earthquakeId: earthquakeId ?? undefined,
      limit, skip, sortBy,
    });
    return Response.json(result);
  } catch (err) {
    console.error('[api/forum/threads GET]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/forum/threads
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, category, author, authorLocation, content, earthquakeId, earthquakeData, tags } = body as Record<string, unknown>;

  if (!title || !category || !author || !content) {
    return Response.json({ error: 'title, category, author, and content are required' }, { status: 400 });
  }
  if (typeof title   === 'string' && title.length   > 200)   return Response.json({ error: 'Title too long (max 200 chars)' },   { status: 400 });
  if (typeof content === 'string' && content.length > 10000) return Response.json({ error: 'Content too long (max 10000 chars)' }, { status: 400 });
  if (typeof author  === 'string' && author.length  > 50)    return Response.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category as ForumCategory)) return Response.json({ error: 'Invalid category' }, { status: 400 });

  try {
    const thread = await createForumThread(env.DB, {
      title:          (title   as string).trim(),
      category:       category as ForumCategory,
      author:         (author  as string).trim(),
      authorLocation: (authorLocation as string | undefined)?.trim(),
      content:        (content as string).trim(),
      earthquakeId:   earthquakeId as string | undefined,
      earthquakeData: earthquakeData as { magnitude: number; place: string; time: string; depth?: number } | undefined,
      tags:           tags as string[] | undefined,
    });
    return Response.json({ thread }, { status: 201 });
  } catch (err) {
    console.error('[api/forum/threads POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
