import type { APIRoute } from 'astro';
import { getAISummary, setAISummary } from '@/lib/kv';
import { generateActivitySummary, type ActivitySummaryInput } from '@/lib/openai';

// Per-IP OpenAI cost guard. Cache hits don't count against the limit;
// only requests that would actually invoke OpenAI do.
const OPENAI_CALLS_PER_WINDOW = 5;
const OPENAI_WINDOW_SECONDS = 300; // 5 minutes

// POST /api/ai-summary
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
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

  // Per-IP throttle: only enforced on cache misses (i.e. actual OpenAI calls)
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
  const throttleKey = `throttle:ai-summary:${ip}`;
  const current = await env.EARTHQUAKE_KV.get(throttleKey);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= OPENAI_CALLS_PER_WINDOW) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(OPENAI_WINDOW_SECONDS) } },
    );
  }
  await env.EARTHQUAKE_KV.put(throttleKey, String(count + 1), {
    expirationTtl: OPENAI_WINDOW_SECONDS,
  });

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
