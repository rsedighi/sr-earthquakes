import type { APIRoute } from 'astro';
import { saveUserAddress, getAddressesByVisitor, type UserAddress } from '@/lib/d1';

// Shape expected by the frontend (`my-neighborhood.tsx`):
//   { _id, address, lat, lon, city, lastSearchAt }  // lastSearchAt is an ISO string
function toClient(a: UserAddress) {
  return {
    _id: a.id,
    address: a.address,
    lat: a.lat,
    lon: a.lon,
    city: a.city ?? undefined,
    lastSearchAt: new Date(a.lastSearchAt).toISOString(),
  };
}

// GET /api/addresses?visitorId=...
export const GET: APIRoute = async ({ url, locals }) => {
  const { env } = locals.runtime;
  const visitorId = url.searchParams.get('visitorId');

  if (!visitorId) {
    return Response.json({ error: 'Missing visitorId parameter' }, { status: 400 });
  }

  try {
    const addresses = await getAddressesByVisitor(env.DB, visitorId);
    return Response.json({ addresses: addresses.map(toClient) });
  } catch (err) {
    console.error('[api/addresses GET]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/addresses
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { visitorId, address, lat, lon, city } = body as {
    visitorId?: string;
    address?: string;
    lat?: number;
    lon?: number;
    city?: string;
  };

  if (!visitorId || !address || typeof lat !== 'number' || typeof lon !== 'number') {
    return Response.json(
      { error: 'Missing required fields: visitorId, address, lat, lon' },
      { status: 400 }
    );
  }

  try {
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const saved = await saveUserAddress(env.DB, {
      visitorId,
      address,
      lat,
      lon,
      city,
      userAgent,
    });
    return Response.json({ success: true, address: toClient(saved) });
  } catch (err) {
    console.error('[api/addresses POST]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
