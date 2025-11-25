import { NextResponse } from 'next/server';

/**
 * Debug route to check Google OAuth configuration
 * This helps diagnose configuration issues
 */
export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    googleOAuth: {
      configured: hasClientId && hasClientSecret,
      hasClientId,
      hasClientSecret,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) || 'N/A',
    },
    nextAuth: {
      hasUrl: hasNextAuthUrl,
      hasSecret: hasNextAuthSecret,
      url: process.env.NEXTAUTH_URL || 'NOT SET',
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
    },
  });
}




