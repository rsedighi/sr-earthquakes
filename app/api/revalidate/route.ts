import { NextRequest, NextResponse } from 'next/server';
import { requireRevalidationSecret } from '@/lib/revalidation-auth';
import { revalidateEarthquakeCaches } from '@/lib/revalidate-earthquake-cache';

/**
 * On-demand revalidation for earthquake-tagged `use cache` entries.
 * Use for manual runs or external webhooks; Vercel Cron uses `/api/earthquakes/monitor`,
 * which revalidates in-process when new quakes are processed.
 *
 * POST: Authorization: Bearer <REVALIDATION_SECRET>
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireRevalidationSecret(request);
  if (unauthorized) return unauthorized;

  revalidateEarthquakeCaches();

  return NextResponse.json({
    revalidated: true,
    tags: ['earthquakes'],
    now: Date.now(),
  });
}
