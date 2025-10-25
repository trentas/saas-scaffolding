import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { createUser } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { debugApi, logError, RequestTimer } from '@/lib/debug';

export async function POST(request: NextRequest) {
  const timer = new RequestTimer('POST /api/auth/signup');
  let email = '';
  
  try {
    debugApi('Starting signup process');
    
    const body = await request.json();
    debugApi('Request body parsed', {
      hasBody: !!body,
      bodyKeys: Object.keys(body || {}),
      contentType: request.headers.get('content-type')
    });
    
    const { name, password } = body;
    email = body.email || '';
    
    debugApi('Signup request received', {
      email,
      name,
      hasPassword: !!password,
      passwordLength: password?.length,
      emailLength: email?.length,
      nameLength: name?.length
    });

    // Validate input
    if (!name || !email || !password) {
      debugApi('Signup validation failed - missing fields', {
        hasName: !!name,
        hasEmail: !!email,
        hasPassword: !!password
      });
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      debugApi('Signup validation failed - invalid email format', { email });
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      debugApi('Signup validation failed - password too short', { passwordLength: password.length });
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Additional password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
    if (!passwordRegex.test(password)) {
      debugApi('Signup validation failed - password complexity', { 
        passwordLength: password.length,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
      });
      return NextResponse.json(
        { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Hash password
    debugApi('Starting password hashing', {
      passwordLength: password.length,
      saltRounds: 12
    });
    const hashStartTime = Date.now();
    const passwordHash = await bcrypt.hash(password, 12);
    const hashEndTime = Date.now();
    
    debugApi('Password hashing completed', {
      hashLength: passwordHash.length,
      hashTimeMs: hashEndTime - hashStartTime,
      hashPrefix: passwordHash.substring(0, 10) + '...'
    });
    
    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    debugApi('Generated verification token', {
      tokenLength: verificationToken.length,
      expiresAt: verificationExpires.toISOString()
    });

    // Create user
    debugApi('Creating user in database', {
      email,
      name,
      hasPasswordHash: !!passwordHash,
      hasVerificationToken: !!verificationToken,
      verificationExpires: verificationExpires.toISOString()
    });
    
    const userStartTime = Date.now();
    const user = await createUser(email, name, passwordHash, verificationToken, verificationExpires);
    const userEndTime = Date.now();
    
    debugApi('User created successfully', {
      userId: user.id,
      email: user.email,
      name: user.name,
      creationTimeMs: userEndTime - userStartTime,
      emailVerified: user.email_verified
    });

    // Send verification email
    debugApi('Preparing to send verification email', {
      to: email,
      tokenLength: verificationToken.length,
      userName: name
    });
    
    const emailStartTime = Date.now();
    await sendVerificationEmail(email, verificationToken, name);
    const emailEndTime = Date.now();
    
    debugApi('Verification email sent', {
      to: email,
      emailTimeMs: emailEndTime - emailStartTime
    });

    debugApi('Signup completed successfully', {
      userId: user.id,
      email: user.email
    });

    timer.end({ success: true, userId: user.id });

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        user: { id: user.id, email: user.email, name: user.name }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    timer.end({ error: true });
    
    debugApi('Signup process failed', {
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack?.substring(0, 200) : undefined
    });
    
    logError(error, 'POST /api/auth/signup');
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      debugApi('Signup failed - email already exists', { 
        email,
        errorCode: error.code,
        errorDetail: 'detail' in error ? error.detail : undefined
      });
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    // Handle other database errors
    if (error && typeof error === 'object' && 'code' in error) {
      debugApi('Signup failed - database error', {
        errorCode: error.code,
        errorMessage: 'message' in error ? error.message : undefined,
        errorDetail: 'detail' in error ? error.detail : undefined
      });
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
