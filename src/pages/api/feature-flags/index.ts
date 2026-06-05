import type { APIRoute } from 'astro';
import { listFeatureFlags, setFeatureFlag, getFeatureFlag } from '@/lib/kv';

// GET /api/feature-flags         — list all flags
// GET /api/feature-flags?key=foo — single flag value
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const key = new URL(request.url).searchParams.get('key');

  if (key) {
    const enabled = await getFeatureFlag(env.FEATURE_FLAGS_KV, key);
    return Response.json({ key, enabled });
  }

  const flags = await listFeatureFlags(env.FEATURE_FLAGS_KV);
  return Response.json({ flags });
};

// PUT /api/feature-flags  body: { key, enabled }
export const PUT: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: { key?: string; enabled?: boolean };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.key || typeof body.enabled !== 'boolean') {
    return Response.json({ error: 'key and enabled (boolean) are required' }, { status: 400 });
  }

  await setFeatureFlag(env.FEATURE_FLAGS_KV, body.key, body.enabled);
  return Response.json({ success: true, key: body.key, enabled: body.enabled });
};
