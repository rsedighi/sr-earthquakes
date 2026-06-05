import type { APIRoute } from 'astro';
import { addToWaitlist } from '@/lib/d1';

// POST /api/ios-waitlist
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, source, referralCode } = body as Record<string, string>;

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 });
  }

  try {
    const result = await addToWaitlist(env.DB, {
      email,
      source,
      referralCode,
      userAgent: request.headers.get('User-Agent') ?? undefined,
    });
    return Response.json({ success: true, isNew: result.isNew }, { status: result.isNew ? 201 : 200 });
  } catch (err) {
    console.error('[api/ios-waitlist POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
