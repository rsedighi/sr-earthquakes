import type { APIRoute } from 'astro';
import { getComments, createComment, getCommentCountsBatch } from '@/lib/d1';
import type { CommentEvent } from '@/durable-objects/CommentRoom';

type CommentRoomStub = DurableObjectStub & { broadcast(event: CommentEvent): Promise<void> };

// GET /api/comments?earthquakeId=xxx
// GET /api/comments?earthquakeIds=xxx,yyy  (batch counts)
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const params = new URL(request.url).searchParams;
  const earthquakeId  = params.get('earthquakeId');
  const earthquakeIds = params.get('earthquakeIds');

  if (earthquakeIds) {
    const ids = earthquakeIds.split(',').filter(Boolean);
    const counts = await getCommentCountsBatch(env.DB, ids);
    return Response.json({ counts });
  }

  if (!earthquakeId) {
    return Response.json({ error: 'earthquakeId is required' }, { status: 400 });
  }

  const comments = await getComments(env.DB, earthquakeId);
  return Response.json({ comments });
};

// POST /api/comments
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { earthquakeId, parentId, author, content, location, feltIt } = body as Record<string, unknown>;

  if (!earthquakeId || !author || !content) {
    return Response.json({ error: 'earthquakeId, author, and content are required' }, { status: 400 });
  }
  if (typeof author === 'string' && author.length > 50) {
    return Response.json({ error: 'Author name too long (max 50 chars)' }, { status: 400 });
  }
  if (typeof content === 'string' && content.length > 1000) {
    return Response.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 });
  }

  const comment = await createComment(env.DB, {
    earthquakeId: earthquakeId as string,
    parentId:     parentId   as string | undefined,
    author:       (author    as string).trim(),
    content:      (content   as string).trim(),
    location:     (location  as string | undefined)?.trim(),
    feltIt:       (feltIt    as boolean) || false,
  });

  // Broadcast to CommentRoom DO for real-time updates
  try {
    const stub = env.COMMENT_ROOM.getByName(earthquakeId as string) as unknown as CommentRoomStub;
    await stub.broadcast({ type: 'created', comment: comment as unknown as Record<string, unknown> });
  } catch {
    // Non-fatal — WS broadcast failure doesn't block the response
  }

  return Response.json({ comment }, { status: 201 });
};
