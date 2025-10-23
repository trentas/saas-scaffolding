import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrganization } from '@/lib/auth';
import { isValidTenantSlug } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, slug } = await request.json();

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { message: 'Organization name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!isValidTenantSlug(slug)) {
      return NextResponse.json(
        { message: 'Invalid organization slug format' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const { data: existingOrg, error: checkError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { message: 'Organization slug is already taken' },
        { status: 409 }
      );
    }

    // Create organization
    const organization = await createOrganization(session.user.id, name, slug);

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error('Organization creation error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { message: 'Organization slug is already taken' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organizations
    const { data: organizations, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        role,
        status,
        organizations (
          id,
          name,
          slug,
          plan,
          created_at
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    const formattedOrganizations = organizations?.map(member => ({
      ...member.organizations,
      role: member.role,
    })) || [];

    return NextResponse.json(formattedOrganizations);
  } catch (error: any) {
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
