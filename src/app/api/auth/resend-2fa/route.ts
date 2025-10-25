import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { send2FACode } from '@/lib/email';
import { generate2FACode, store2FACode } from '@/lib/two-factor';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email || !session?.user?.name) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate new 2FA code
    const code = generate2FACode();
    
    // Store code in database
    await store2FACode(session.user.id, code);
    
    // Send code via email
    await send2FACode(session.user.email, code, session.user.name);

    return NextResponse.json(
      { message: 'Verification code sent successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Resend 2FA error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
