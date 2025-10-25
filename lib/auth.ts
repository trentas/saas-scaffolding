import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuidv4 } from 'uuid';

import { debugAuth, debugDatabase, logError, RequestTimer } from './debug';
import { supabaseAdmin } from './supabase';

// For now, let's use JWT strategy instead of database sessions
// Database sessions require a proper adapter implementation

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    // Credentials Provider for email/password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Check if account is locked
          if (user.locked_until && new Date(user.locked_until) > new Date()) {
            throw new Error('AccountLocked');
          }

          // Check email verification
          if (!user.email_verified) {
            throw new Error('EmailNotVerified');
          }

          // Verify password
          if (!user.password_hash) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 minutes lock

            await supabaseAdmin
              .from('users')
              .update({
                failed_login_attempts: failedAttempts,
                locked_until: lockUntil,
              })
              .eq('id', user.id);

            throw new Error('Invalid credentials');
          }

          // Reset failed attempts on successful login
          await supabaseAdmin
            .from('users')
            .update({
              failed_login_attempts: 0,
              locked_until: null,
              last_login_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  
  callbacks: {
    async signIn() {
      // This callback is called before the authorize function
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    
    async jwt({ token, user, account }) {
      try {
        // For OAuth providers (Google), create user if doesn't exist
        if (account?.provider === 'google') {
          const { data: existingUser, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            // eslint-disable-next-line no-console
            console.error('Database error:', error);
            return false;
          }

          // If user doesn't exist, create them
          if (!existingUser) {
            const { error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email!,
                name: user.name,
                avatar_url: user.image,
                email_verified: true, // OAuth users are pre-verified
              })
              .select()
              .single();

            if (createError) {
              // eslint-disable-next-line no-console
              console.error('Error creating user:', createError);
              return false;
            }
          }
        }

        if (user) {
          token.id = user.id;
        }
        return token;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Sign in error:', error);
        return false;
      }
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        // Get user's organizations
        const { data: organizations } = await supabaseAdmin
          .from('organization_members')
          .select(`
            role,
            organizations (
              id,
              name,
              slug,
              plan
            )
          `)
          .eq('user_id', token.sub)
          .eq('status', 'active');

        session.user.organizations = organizations?.map((member: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: member.organizations.id,
          name: member.organizations.name,
          slug: member.organizations.slug,
          plan: member.organizations.plan,
          role: member.role,
        })) || [];
      }

      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for authentication

export async function createUser(
  email: string, 
  name: string, 
  passwordHash: string, 
  verificationToken: string, 
  verificationExpires: Date
) {
  const timer = new RequestTimer('createUser');
  
  try {
    debugAuth('Creating new user', {
      email,
      name,
      hasPassword: !!passwordHash,
      tokenLength: verificationToken.length,
      expiresAt: verificationExpires.toISOString()
    });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
      })
      .select()
      .single();

    if (error) {
      debugDatabase('Database error creating user', { error });
      throw error;
    }

    debugAuth('User created successfully', {
      userId: user.id,
      email: user.email,
      emailVerified: user.email_verified
    });

    timer.end({ userId: user.id });
    return user;
  } catch (error) {
    timer.end({ error: true });
    logError(error, 'createUser');
    throw error;
  }
}

export async function verifyEmailToken(token: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .gt('email_verification_expires', new Date().toISOString())
      .single();

    if (error || !user) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Update user as verified
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true, user };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying email:', error);
    return { success: false, message: 'Verification failed' };
  }
}

export async function createPasswordResetToken(email: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, message: 'User not found' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true, token: resetToken, user };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating reset token:', error);
    return { success: false, message: 'Failed to create reset token' };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    if (error || !user) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Invalidate all existing sessions
    await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error resetting password:', error);
    return { success: false, message: 'Password reset failed' };
  }
}

export async function createOrganization(userId: string, name: string, slug: string) {
  try {
    // Create organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        plan: 'free',
      })
      .select()
      .single();

    if (orgError) {
      throw orgError;
    }

    // Add user as owner
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        user_id: userId,
        organization_id: organization.id,
        role: 'owner',
        status: 'active',
      })
      .select()
      .single();

    if (memberError) {
      throw memberError;
    }

    return organization;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating organization:', error);
    throw error;
  }
}