import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * API route to check which auth providers are available
 * This is needed because client-side code can't access server-side env vars
 */
export async function GET(request: NextRequest) {
  const limited = apiRateLimit(request);
  if (limited) return limited;

  const providers: { google: boolean } = {
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  };

  return NextResponse.json({ providers });
}
