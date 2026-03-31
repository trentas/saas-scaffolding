import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { revokeRefreshToken, revokeAllUserTokens } from '@/lib/microservice-auth';
import { apiRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = apiRateLimit(request);
  if (limited) return limited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { refreshToken, revokeAll } = await request.json();

    if (revokeAll) {
      // Revoke all tokens for the user
      await revokeAllUserTokens(session.user.id);
      return NextResponse.json({ message: 'All refresh tokens revoked successfully' });
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Revoke specific token
    await revokeRefreshToken(refreshToken);

    return NextResponse.json({ message: 'Refresh token revoked successfully' });
  } catch (error: unknown) {
    console.error('Error revoking refresh token:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

