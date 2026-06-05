import type { APIRoute } from 'astro';
import { saveFeedback, type FeedbackType } from '@/lib/d1';

const VALID_TYPES: FeedbackType[] = ['feedback', 'improvement', 'bug', 'feature', 'advertising'];

// POST /api/feedback
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, name, email, message, page } = body as Record<string, string>;

  if (!type || !name || !email || !message || !page) {
    return Response.json({ error: 'type, name, email, message, and page are required' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as FeedbackType)) {
    return Response.json({ error: 'Invalid feedback type' }, { status: 400 });
  }
  if (message.length > 5000) {
    return Response.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
  }

  try {
    const userAgent = request.headers.get('User-Agent') ?? undefined;
    const feedback = await saveFeedback(env.DB, {
      type: type as FeedbackType,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      page,
      userAgent,
    });
    return Response.json({ feedback }, { status: 201 });
  } catch (err) {
    console.error('[api/feedback POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
