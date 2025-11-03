import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canInviteMembers, canManageMembers } from '@/lib/permissions';
import { getServerTranslation } from '@/lib/server-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { PendingInvitationCard } from '@/components/team/PendingInvitationCard';

interface TeamPageProps {
  params: {
    tenant: string;
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await getServerSession(authOptions);
  const { t } = await getServerTranslation();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Await params before using
  const { tenant } = await params;

  // Get user's organization context
  const { userRole, organizationId } = await getUserOrganizationContext(session.user.id, tenant);
  
  // Check permissions
  if (!canManageMembers(userRole)) {
    redirect(`/${tenant}/dashboard`);
  }

  // Fetch team data directly
  const { supabaseAdmin } = await import('@/lib/supabase');
  const { debugDatabase } = await import('@/lib/debug');
  
  // Get team members with user details
  const { data: membersData, error: membersError } = await supabaseAdmin
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      status,
      created_at,
      users!organization_members_user_id_fkey (
        name,
        email,
        avatar_url
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (membersError) {
    debugDatabase('Failed to fetch team members', { error: membersError });
  }

  const members = membersData?.map(member => ({
    id: member.id,
    userId: member.user_id,
    name: member.users.name || 'Unknown',
    email: member.users.email,
    avatarUrl: member.users.avatar_url,
    role: member.role as 'owner' | 'admin' | 'member',
    status: member.status as 'active' | 'pending' | 'suspended',
    joinedAt: member.created_at
  })) || [];

  // Get pending invitations
  const { data: invitationsData, error: invitationsError } = await supabaseAdmin
    .from('invitations')
    .select(`
      id,
      email,
      role,
      token,
      expires_at,
      created_at,
      invited_by,
      users!invitations_invited_by_fkey (
        name
      )
    `)
    .eq('organization_id', organizationId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (invitationsError) {
    debugDatabase('Failed to fetch pending invitations', { error: invitationsError });
  }

  const invitations = invitationsData?.map(invitation => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as 'admin' | 'member',
    token: invitation.token,
    expiresAt: invitation.expires_at,
    invitedBy: invitation.invited_by,
    invitedByName: invitation.users?.name || 'Unknown',
    createdAt: invitation.created_at
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('team.title')}</h1>
          <p className="text-muted-foreground">
            {t('team.subtitle')}
          </p>
        </div>
        {canInviteMembers(userRole) && (
          <InviteMemberDialog
            organizationId={organizationId}
          />
        )}
      </div>

      {/* Active Members */}
      <Card>
        <CardHeader>
          <CardTitle>{t('team.members')}</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? t('team.member') : t('team.members')} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  currentUserRole={userRole}
                  currentUserId={session.user.id}
                  organizationId={organizationId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('team.noMembers')}</p>
              {canInviteMembers(userRole) && (
                <p className="text-sm">{t('team.inviteFirstMember')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('team.pendingInvitations')}</CardTitle>
            <CardDescription>
              {invitations.length} pending {invitations.length === 1 ? t('team.invitation') : t('team.invitations')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <PendingInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  currentUserRole={userRole}
                  organizationId={organizationId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to get user's organization context
async function getUserOrganizationContext(userId: string, tenant: string) {
  const { supabaseAdmin } = await import('@/lib/supabase');
  
  // Get organization by slug
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', tenant)
    .single();

  if (orgError || !org) {
    throw new Error('Organization not found');
  }

  // Get user's membership
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('organization_members')
    .select('role, status')
    .eq('user_id', userId)
    .eq('organization_id', org.id)
    .single();

  if (membershipError || !membership) {
    throw new Error('User not found in organization');
  }

  return {
    organizationId: org.id,
    organizationName: org.name,
    userRole: membership.role as 'owner' | 'admin' | 'member',
    userStatus: membership.status
  };
}
