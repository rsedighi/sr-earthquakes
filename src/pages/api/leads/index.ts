import type { APIRoute } from 'astro';
import { saveLead, type LeadCategory } from '@/lib/d1';

const VALID_CATEGORIES: LeadCategory[] = ['insurance', 'retrofit', 'preparedness', 'general'];

// SHA-256 hash of the client IP so we can dedupe / rate-analyze without storing PII.
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
    consent, consentText, source,
  } = body as Record<string, unknown>;

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

    return Response.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    console.error('[api/leads POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
