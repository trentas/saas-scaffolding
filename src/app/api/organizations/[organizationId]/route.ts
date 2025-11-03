import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { canManageMembers } from '@/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { organizationId } = await params;
    const { name } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Organization name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { message: 'Organization name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { message: 'Organization name must be less than 100 characters' },
        { status: 400 }
      );
    }

    // Get organization to check permissions
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check user's membership and role
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('organization_members')
      .select('role, status')
      .eq('user_id', session.user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { message: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Check permissions - only owners and admins can rename
    if (!canManageMembers(membership.role)) {
      return NextResponse.json(
        { message: 'You do not have permission to rename this organization' },
        { status: 403 }
      );
    }

    // Update organization name
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ name: trimmedName })
      .eq('id', organizationId)
      .select('id, name, slug')
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json(
        { message: 'Failed to update organization name' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrg, { status: 200 });
  } catch (error: unknown) {
    console.error('Organization update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

