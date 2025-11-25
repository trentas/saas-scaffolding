import { NextRequest } from 'next/server';
import NextAuth from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { debugAuth, logger } from '@/lib/debug';

const handler = NextAuth(authOptions);

// Wrap handlers to add logging
async function wrappedHandler(req: NextRequest, context: { params: { nextauth: string[] } }) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;
  
  // Log OAuth signin attempts
  if (pathname.includes('/signin/google')) {
    const callbackUrl = searchParams.get('callbackUrl');
    debugAuth('Google OAuth signin request', {
      pathname,
      callbackUrl,
      fullUrl: req.nextUrl.toString(),
      referer: req.headers.get('referer'),
      userAgent: req.headers.get('user-agent')?.substring(0, 50),
    });
  }
  
  // Log callback attempts
  if (pathname.includes('/callback/google')) {
    const error = searchParams.get('error');
    const code = searchParams.get('code');
    debugAuth('Google OAuth callback request', {
      pathname,
      hasError: !!error,
      hasCode: !!code,
      error,
      fullUrl: req.nextUrl.toString(),
    });
  }
  
  try {
    const response = await handler(req, context);
    
    // Log response if it's a redirect with error
    if (response instanceof Response) {
      const location = response.headers.get('location');
      if (location?.includes('error=google') || location?.includes('error=OAuthSignin')) {
        logger.error('NextAuth returned OAuth error in redirect', {
          location,
          pathname,
          status: response.status,
        });
      }
    }
    
    return response;
  } catch (error: unknown) {
    logger.error('NextAuth handler exception', {
      error: error instanceof Error ? error.message : String(error),
      pathname,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
