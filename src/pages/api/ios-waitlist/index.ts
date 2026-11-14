import type { APIRoute } from 'astro';
import { addToWaitlist, getWaitlistCount } from '@/lib/d1';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/ios-waitlist — public signup count for the iOS page.
export const GET: APIRoute = async ({ locals }) => {
  const { env } = locals.runtime;
  try {
    const totalSignups = env.DB ? await getWaitlistCount(env.DB) : 0;
    return Response.json(
      { totalSignups },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    );
  } catch (err) {
    console.error('[api/ios-waitlist GET]', err);
    return Response.json({ totalSignups: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
};

// POST /api/ios-waitlist — idempotent signup. Repeat submissions return 200 with isNew=false.
export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const source = typeof body.source === 'string' ? body.source.slice(0, 40) : undefined;
  const referralCode = typeof body.referralCode === 'string' ? body.referralCode.slice(0, 40) : undefined;

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    const { isNew } = await addToWaitlist(env.DB, {
      email,
      source,
      referralCode,
      userAgent: request.headers.get('User-Agent')?.slice(0, 256) ?? undefined,
    });
    return Response.json(
      {
        success: true,
        isNew,
        message: isNew
          ? "You're on the list! We'll email you when the iOS app launches."
          : "You're already on the list. We'll email you when the iOS app launches.",
      },
      { status: isNew ? 201 : 200 },
    );
  } catch (err) {
    console.error('[api/ios-waitlist POST]', err);
    return Response.json({ error: 'Could not join the waitlist. Please try again.' }, { status: 500 });
  }
};
