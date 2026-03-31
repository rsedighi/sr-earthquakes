import { NextRequest, NextResponse } from 'next/server';

export function requireAdminSecret(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('Authorization');
  const expected = process.env.ADMIN_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'Server misconfigured: ADMIN_SECRET not set' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
