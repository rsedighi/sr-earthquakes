import type { APIRoute } from 'astro';
import { saveLead, getLeads, type LeadCategory, type LeadStatus } from '@/lib/d1';

const VALID_CATEGORIES: LeadCategory[] = ['insurance', 'retrofit', 'preparedness', 'general'];

// Max lead submissions per IP per hour. KV increments are not atomic, so treat
// this as spam damping, not a hard guarantee.
const RATE_LIMIT_PER_HOUR = 5;

// SHA-256 hash of the client IP so we can dedupe / rate-analyze without storing PII.
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isRateLimited(kv: KVNamespace | undefined, ipHash: string): Promise<boolean> {
  if (!kv) return false;
  const key = `leads:rl:${ipHash}`;
  const current = parseInt((await kv.get(key)) ?? '0', 10);
  if (current >= RATE_LIMIT_PER_HOUR) return true;
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return false;
}

/** Fire-and-forget webhook (Slack/Discord-compatible) so new leads surface immediately. */
async function notifyWebhook(url: string, lead: { category: string; city?: string; riskBand?: string; email: string }) {
  const text =
    `New ${lead.category} lead: ${lead.email}` +
    (lead.city ? ` — ${lead.city}` : '') +
    (lead.riskBand ? ` (risk: ${lead.riskBand})` : '');
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `text` works for Slack; `content` for Discord. Send both.
      body: JSON.stringify({ text, content: text }),
    });
  } catch (err) {
    console.error('[api/leads] webhook notify failed:', err);
  }
}

// POST /api/leads
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    visitorId, addressId, name, email, phone, address, city, lat, lon,
    category, riskScore, riskBand, nearestFault,
    ownership, homeAge, foundationType, hasInsurance,
    consent, consentText, source, website,
  } = body as Record<string, unknown>;

  // Honeypot: real users never see or fill this field. Pretend success so bots
  // don't adapt.
  if (typeof website === 'string' && website.trim() !== '') {
    return Response.json({ success: true, leadId: 'ok' }, { status: 201 });
  }

  // ── Validation ──
  if (typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const cat: LeadCategory = VALID_CATEGORIES.includes(category as LeadCategory)
    ? (category as LeadCategory)
    : 'general';

  // Consent is REQUIRED — never store a lead as sellable without explicit opt-in.
  if (consent !== true) {
    return Response.json(
      { error: 'Consent is required to submit this request' },
      { status: 400 }
    );
  }

  try {
    const ip = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = await hashIp(ip);

    if (await isRateLimited(env.EARTHQUAKE_KV, ipHash)) {
      return Response.json(
        { error: 'Too many requests — please try again later' },
        { status: 429 }
      );
    }

    const lead = await saveLead(env.DB, {
      visitorId: typeof visitorId === 'string' ? visitorId : undefined,
      addressId: typeof addressId === 'string' ? addressId : undefined,
      name: typeof name === 'string' ? name.trim() : undefined,
      email: email.trim().toLowerCase(),
      phone: typeof phone === 'string' ? phone.trim() : undefined,
      address: typeof address === 'string' ? address : undefined,
      city: typeof city === 'string' ? city : undefined,
      lat: typeof lat === 'number' ? lat : undefined,
      lon: typeof lon === 'number' ? lon : undefined,
      category: cat,
      riskScore: typeof riskScore === 'number' ? riskScore : undefined,
      riskBand: typeof riskBand === 'string' ? riskBand : undefined,
      nearestFault: typeof nearestFault === 'string' ? nearestFault : undefined,
      ownership: typeof ownership === 'string' ? ownership : undefined,
      homeAge: typeof homeAge === 'string' ? homeAge : undefined,
      foundationType: typeof foundationType === 'string' ? foundationType : undefined,
      hasInsurance: typeof hasInsurance === 'boolean' ? hasInsurance : undefined,
      consent: true,
      consentText: typeof consentText === 'string' ? consentText : undefined,
      source: typeof source === 'string' ? source : 'my-area',
      userAgent: request.headers.get('User-Agent') ?? undefined,
      ipHash,
    });

    if (env.LEAD_WEBHOOK_URL) {
      // Don't let a slow webhook delay the user's response.
      locals.runtime.ctx.waitUntil(
        notifyWebhook(env.LEAD_WEBHOOK_URL, {
          category: cat,
          city: typeof city === 'string' ? city : undefined,
          riskBand: typeof riskBand === 'string' ? riskBand : undefined,
          email: lead.email,
        })
      );
    }

    return Response.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    console.error('[api/leads POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// GET /api/leads — admin only. Auth: `Authorization: Bearer <ADMIN_TOKEN>`.
// Set the secret with: `npx wrangler secret put ADMIN_TOKEN`.
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return Response.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 });
  }
  const auth = request.headers.get('Authorization') ?? '';
  if (auth !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') as LeadStatus | null;
  const category = url.searchParams.get('category') as LeadCategory | null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500);
  const skip = parseInt(url.searchParams.get('skip') ?? '0', 10);

  try {
    const { leads, total } = await getLeads(env.DB, {
      limit,
      skip,
      status: status ?? undefined,
      category: category && VALID_CATEGORIES.includes(category) ? category : undefined,
    });
    return Response.json({ leads, total });
  } catch (err) {
    console.error('[api/leads GET]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
