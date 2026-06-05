import type { APIRoute } from 'astro';
import { unregisterDevice } from '@/lib/d1';

// POST /api/devices/unregister
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token } = body as { token?: string };
  if (!token) {
    return Response.json({ error: 'token is required' }, { status: 400 });
  }

  await unregisterDevice(env.DB, token);
  return Response.json({ success: true });
};
