import type { APIRoute } from 'astro';
import { registerDevice } from '@/lib/d1';

// POST /api/devices/register
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, city, minMagnitude, lat, lon, radiusMiles } = body as Record<string, unknown>;

  if (!token) {
    return Response.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    await registerDevice(env.DB, {
      token:        token as string,
      city:         city as string | undefined,
      minMagnitude: typeof minMagnitude === 'number' ? minMagnitude : undefined,
      lat:          typeof lat === 'number' ? lat : undefined,
      lon:          typeof lon === 'number' ? lon : undefined,
      radiusMiles:  typeof radiusMiles === 'number' ? radiusMiles : undefined,
    });
    return Response.json({ success: true });
  } catch (err) {
    console.error('[api/devices/register POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
