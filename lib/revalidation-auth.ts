import { NextRequest, NextResponse } from 'next/server';

/** Bearer REVALIDATION_SECRET — for cron / webhooks only (not full admin). */
export function requireRevalidationSecret(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('Authorization');
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'Server misconfigured: REVALIDATION_SECRET not set' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
