// import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { supabaseAdmin } from './supabase';

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

          // In a real implementation, you'd verify the password hash
          // For now, we'll assume password verification is handled elsewhere
          // You should implement proper password hashing and verification
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user }) {
      try {
        // Check if user exists in database
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
            })
            .select()
            .single();

          if (createError) {
            // eslint-disable-next-line no-console
            console.error('Error creating user:', createError);
            return false;
          }
        }

        return true;
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

        session.user.organizations = organizations?.map(member => ({
          ...member.organizations,
          role: member.role,
        })) || [];
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for authentication

export async function createUser(email: string, name: string) {
  try {
    // Hash password if provided
    // const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        // In a real implementation, you'd store the hashed password
        // For now, we'll skip password storage
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating user:', error);
    throw error;
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

export async function verifyPassword(): Promise<boolean> {
  try {
    // In a real implementation, you'd verify the password hash
    // For now, we'll return true for demo purposes
    // You should implement proper password verification
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying password:', error);
    return false;
  }
}
