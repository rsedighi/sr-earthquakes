import type { APIRoute } from 'astro';
import { getAISummary, setAISummary } from '@/lib/kv';
import { generateActivitySummary, type ActivitySummaryInput } from '@/lib/openai';

// POST /api/ai-summary
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: ActivitySummaryInput;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.regionId || body.currentCount === undefined) {
    return Response.json({ error: 'regionId and currentCount are required' }, { status: 400 });
  }

  // KV cache key based on region + count tier + multiplier bracket
  const cacheKey = `${body.regionId}:${body.currentCount}:${body.multiplier?.toFixed(1) ?? '0'}`;

  const cached = await getAISummary(env.EARTHQUAKE_KV, cacheKey);
  if (cached) {
    return Response.json({ summary: cached, cached: true });
  }

  // Pass the API key from env to the openai helper
  const summary = await generateActivitySummary(body, env.OPENAI_API_KEY);
  if (!summary) {
    return Response.json(
      { error: 'AI summary unavailable. Check OPENAI_API_KEY configuration.' },
      { status: 503 },
    );
  }

  await setAISummary(env.EARTHQUAKE_KV, cacheKey, summary);
  return Response.json({ summary, cached: false });
};
