import { NextResponse } from 'next/server';

/**
 * API route to check which auth providers are available
 * This is needed because client-side code can't access server-side env vars
 */
export async function GET() {
  const providers: { google: boolean } = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  };

  return NextResponse.json({ providers });
}




