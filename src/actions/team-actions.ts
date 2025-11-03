"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendInvitationEmail, sendOwnershipTransferEmail } from "@/lib/email";
import { actionClient } from "./safe-action";
import { 
  inviteMemberSchema, 
  updateMemberRoleSchema, 
  removeMemberSchema, 
  transferOwnershipSchema,
  invitationActionSchema,
  acceptInvitationSchema 
} from "@/lib/form-schema";
import { canInviteMembers, canManageMembers, canChangeRoles, canRemoveMembers } from "@/lib/permissions";
import { debugDatabase, logError } from "@/lib/debug";
import { randomBytes } from "crypto";

// Types for team data
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  token: string;
  expiresAt: string;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
}

// Helper function to get user's organization and role by organization ID
async function getUserOrganizationContextById(userId: string, organizationId: string) {
  debugDatabase('Getting user organization context by ID', { userId, organizationId });
  
  // Get organization by ID
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    debugDatabase('Organization not found', { organizationId, error: orgError });
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
    debugDatabase('User membership not found', { userId, orgId: org.id, error: membershipError });
    throw new Error('User not found in organization');
  }

  return {
    organizationId: org.id,
    organizationName: org.name,
    userRole: membership.role as 'owner' | 'admin' | 'member',
    userStatus: membership.status
  };
}

// Helper function to get user's organization and role by tenant slug
async function getUserOrganizationContext(userId: string, tenant: string) {
  debugDatabase('Getting user organization context', { userId, tenant });
  
  // Get organization by slug
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', tenant)
    .single();

  if (orgError || !org) {
    debugDatabase('Organization not found', { tenant, error: orgError });
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
    debugDatabase('User membership not found', { userId, orgId: org.id, error: membershipError });
    throw new Error('User not found in organization');
  }

  return {
    organizationId: org.id,
    organizationName: org.name,
    userRole: membership.role as 'owner' | 'admin' | 'member',
    userStatus: membership.status
  };
}

// Invite member action
export const inviteMemberAction = actionClient
  .inputSchema(inviteMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { email, role, organizationId } = parsedInput;
      
      // Get user's organization context
      const { userRole, organizationName } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canInviteMembers(userRole)) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('user_id', existingUser?.id || '')
        .single();

      if (existingMember) {
        if (existingMember.status === 'active') {
          throw new Error('User is already a member of this organization');
        } else if (existingMember.status === 'pending') {
          throw new Error('User already has a pending invitation');
        }
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabaseAdmin
        .from('invitations')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingInvitation) {
        throw new Error('User already has a pending invitation');
      }

      // Generate invitation token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation record
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('invitations')
        .insert({
          email,
          organization_id: organizationId,
          role,
          token,
          expires_at: expiresAt.toISOString(),
          invited_by: session.user.id
        })
        .select()
        .single();

      if (invitationError) {
        debugDatabase('Failed to create invitation', { error: invitationError });
        throw new Error('Failed to create invitation');
      }

      // Send invitation email
      await sendInvitationEmail(email, token, organizationName, session.user.name || 'Someone');

      debugDatabase('Member invitation created successfully', {
        invitationId: invitation.id,
        email,
        role,
        organizationId
      });

      revalidatePath('/[tenant]/team', 'page');
      
      return {
        success: true,
        message: 'Invitation sent successfully',
        invitationId: invitation.id
      };
    } catch (error) {
      logError(error, 'inviteMemberAction');
      throw error;
    }
  });

// Resend invitation action
export const resendInvitationAction = actionClient
  .inputSchema(invitationActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { invitationId, organizationId } = parsedInput;
      
      // Get user's organization context
      const { userRole, organizationName } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canManageMembers(userRole)) {
        throw new Error('Insufficient permissions to resend invitations');
      }

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('invitations')
        .select('email, token, expires_at')
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Check if invitation is still valid
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Resend email
      await sendInvitationEmail(
        invitation.email, 
        invitation.token, 
        organizationName, 
        session.user.name || 'Someone'
      );

      debugDatabase('Invitation resent successfully', {
        invitationId,
        email: invitation.email
      });

      return {
        success: true,
        message: 'Invitation resent successfully'
      };
    } catch (error) {
      logError(error, 'resendInvitationAction');
      throw error;
    }
  });

// Cancel invitation action
export const cancelInvitationAction = actionClient
  .inputSchema(invitationActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { invitationId, organizationId } = parsedInput;
      
      // Get user's organization context
      const { userRole } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canManageMembers(userRole)) {
        throw new Error('Insufficient permissions to cancel invitations');
      }

      // Delete invitation
      const { error: deleteError } = await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId);

      if (deleteError) {
        debugDatabase('Failed to cancel invitation', { error: deleteError });
        throw new Error('Failed to cancel invitation');
      }

      debugDatabase('Invitation cancelled successfully', { invitationId });

      revalidatePath('/[tenant]/team', 'page');
      
      return {
        success: true,
        message: 'Invitation cancelled successfully'
      };
    } catch (error) {
      logError(error, 'cancelInvitationAction');
      throw error;
    }
  });

// Remove member action
export const removeMemberAction = actionClient
  .inputSchema(removeMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { memberId, organizationId } = parsedInput;
      
      // Get user's organization context
      const { userRole } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Get member details
      const { data: member, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single();

      if (memberError || !member) {
        throw new Error('Member not found');
      }

      // Check permissions
      if (!canRemoveMembers(userRole, member.role as 'owner' | 'admin' | 'member')) {
        throw new Error('Insufficient permissions to remove this member');
      }

      // Prevent removing yourself
      if (member.user_id === session.user.id) {
        throw new Error('You cannot remove yourself from the organization');
      }

      // Check if this is the last owner
      if (member.role === 'owner') {
        const { data: ownerCount } = await supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('role', 'owner')
          .eq('status', 'active');

        if (ownerCount && ownerCount.length <= 1) {
          throw new Error('Cannot remove the last owner from the organization');
        }
      }

      // Remove member
      const { error: removeError } = await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId);

      if (removeError) {
        debugDatabase('Failed to remove member', { error: removeError });
        throw new Error('Failed to remove member');
      }

      debugDatabase('Member removed successfully', { memberId, memberRole: member.role });

      revalidatePath('/[tenant]/team', 'page');
      
      return {
        success: true,
        message: 'Member removed successfully'
      };
    } catch (error) {
      logError(error, 'removeMemberAction');
      throw error;
    }
  });

// Transfer ownership action
export const transferOwnershipAction = actionClient
  .inputSchema(transferOwnershipSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { newOwnerMemberId, organizationId } = parsedInput;
      
      // Get current user's organization context
      const { userRole: currentUserRole, organizationName } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Only owners can transfer ownership
      if (currentUserRole !== 'owner') {
        throw new Error('Only organization owners can transfer ownership');
      }

      // Get new owner member details with user info
      const { data: newOwnerMember, error: newOwnerError } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role, users!organization_members_user_id_fkey (name, email)')
        .eq('id', newOwnerMemberId)
        .eq('organization_id', organizationId)
        .single();

      if (newOwnerError || !newOwnerMember) {
        throw new Error('Member not found');
      }

      // Cannot transfer to yourself
      if (newOwnerMember.user_id === session.user.id) {
        throw new Error('You are already the owner');
      }

      // Get current owner's name
      const { data: currentOwnerUser } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .single();

      const previousOwnerName = currentOwnerUser?.name || 'The previous owner';
      const newOwnerName = (newOwnerMember.users as any)?.name || 'User';
      const newOwnerEmail = (newOwnerMember.users as any)?.email;

      // Use a transaction to ensure atomicity
      // Step 1: Demote current owner to admin
      const { error: demoteError } = await supabaseAdmin
        .from('organization_members')
        .update({ role: 'admin' })
        .eq('user_id', session.user.id)
        .eq('organization_id', organizationId)
        .eq('role', 'owner');

      if (demoteError) {
        debugDatabase('Failed to demote current owner', { error: demoteError });
        throw new Error('Failed to transfer ownership');
      }

      // Step 2: Promote new owner
      const { error: promoteError } = await supabaseAdmin
        .from('organization_members')
        .update({ role: 'owner' })
        .eq('id', newOwnerMemberId)
        .eq('organization_id', organizationId);

      if (promoteError) {
        debugDatabase('Failed to promote new owner', { error: promoteError });
        // Rollback: try to restore current owner
        await supabaseAdmin
          .from('organization_members')
          .update({ role: 'owner' })
          .eq('user_id', session.user.id)
          .eq('organization_id', organizationId);
        throw new Error('Failed to transfer ownership');
      }

      debugDatabase('Ownership transferred successfully', { 
        fromUserId: session.user.id, 
        toUserId: newOwnerMember.user_id 
      });

      // Send email notification to new owner
      if (newOwnerEmail) {
        try {
          await sendOwnershipTransferEmail(
            newOwnerEmail,
            organizationName,
            newOwnerName,
            previousOwnerName
          );
        } catch (emailError) {
          // Log email error but don't fail the transaction
          debugDatabase('Failed to send ownership transfer email', { error: emailError });
        }
      }

      revalidatePath('/[tenant]/team', 'page');
      
      return {
        success: true,
        message: 'Ownership transferred successfully'
      };
    } catch (error) {
      logError(error, 'transferOwnershipAction');
      throw error;
    }
  });

// Update member role action
export const updateMemberRoleAction = actionClient
  .inputSchema(updateMemberRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { memberId, role, organizationId } = parsedInput;
      
      // Get user's organization context
      const { userRole } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canChangeRoles(userRole)) {
        throw new Error('Insufficient permissions to change member roles');
      }

      // Get member details
      const { data: member, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single();

      if (memberError || !member) {
        throw new Error('Member not found');
      }

      // Prevent changing your own role
      if (member.user_id === session.user.id) {
        throw new Error('You cannot change your own role');
      }

      // Prevent demoting the last owner
      if (member.role === 'owner' && role !== 'owner') {
        const { data: ownerCount } = await supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('role', 'owner')
          .eq('status', 'active');

        if (ownerCount && ownerCount.length <= 1) {
          throw new Error('Cannot demote the last owner');
        }
      }

      // Update member role
      const { error: updateError } = await supabaseAdmin
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

      if (updateError) {
        debugDatabase('Failed to update member role', { error: updateError });
        throw new Error('Failed to update member role');
      }

      debugDatabase('Member role updated successfully', { 
        memberId, 
        oldRole: member.role, 
        newRole: role 
      });

      revalidatePath('/[tenant]/team', 'page');
      
      return {
        success: true,
        message: 'Member role updated successfully'
      };
    } catch (error) {
      logError(error, 'updateMemberRoleAction');
      throw error;
    }
  });

// Get team members action
// NOTE: This action is currently not used in the app - data is fetched directly in server components
export const getTeamMembersAction = actionClient
  .action(async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      // Get user's first organization from session
      const organizations = (session.user as any)?.organizations || [];
      if (organizations.length === 0) {
        throw new Error('No organizations found');
      }
      const organizationId = organizations[0].id;

      // Get user's organization context
      const { userRole } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canManageMembers(userRole)) {
        throw new Error('Insufficient permissions to view team members');
      }

      // Get team members with user details
      const { data: members, error: membersError } = await supabaseAdmin
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
        throw new Error('Failed to fetch team members');
      }

      const teamMembers: TeamMember[] = members.map(member => ({
        id: member.id,
        userId: member.user_id,
        name: member.users.name || 'Unknown',
        email: member.users.email,
        avatarUrl: member.users.avatar_url,
        role: member.role as 'owner' | 'admin' | 'member',
        status: member.status as 'active' | 'pending' | 'suspended',
        joinedAt: member.created_at
      }));

      debugDatabase('Team members fetched successfully', { 
        count: teamMembers.length,
        organizationId 
      });

      return {
        success: true,
        data: teamMembers
      };
    } catch (error) {
      logError(error, 'getTeamMembersAction');
      throw error;
    }
  });

// Get pending invitations action
// NOTE: This action is currently not used in the app - data is fetched directly in server components
export const getPendingInvitationsAction = actionClient
  .action(async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      // Get user's first organization from session
      const organizations = (session.user as any)?.organizations || [];
      if (organizations.length === 0) {
        throw new Error('No organizations found');
      }
      const organizationId = organizations[0].id;

      // Get user's organization context
      const { userRole } = await getUserOrganizationContextById(session.user.id, organizationId);
      
      // Check permissions
      if (!canManageMembers(userRole)) {
        throw new Error('Insufficient permissions to view pending invitations');
      }

      // Get pending invitations with inviter details
      const { data: invitations, error: invitationsError } = await supabaseAdmin
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
        throw new Error('Failed to fetch pending invitations');
      }

      const pendingInvitations: PendingInvitation[] = invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as 'admin' | 'member',
        token: invitation.token,
        expiresAt: invitation.expires_at,
        invitedBy: invitation.invited_by,
        invitedByName: invitation.users?.name || 'Unknown',
        createdAt: invitation.created_at
      }));

      debugDatabase('Pending invitations fetched successfully', { 
        count: pendingInvitations.length,
        organizationId 
      });

      return {
        success: true,
        data: pendingInvitations
      };
    } catch (error) {
      logError(error, 'getPendingInvitationsAction');
      throw error;
    }
  });

// Accept invitation action
export const acceptInvitationAction = actionClient
  .inputSchema(acceptInvitationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Unauthorized');
      }

      const { token } = parsedInput;

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('invitations')
        .select(`
          id,
          email,
          role,
          organization_id,
          expires_at,
          organizations!inner (
            id,
            name,
            slug
          )
        `)
        .eq('token', token)
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is still valid
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if user email matches invitation email
      if (session.user.email !== invitation.email) {
        throw new Error('This invitation is not for your email address');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('organization_id', invitation.organization_id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this organization');
      }

      // Add user to organization
      const { error: addMemberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          user_id: session.user.id,
          organization_id: invitation.organization_id,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.invited_by
        });

      if (addMemberError) {
        debugDatabase('Failed to add member to organization', { error: addMemberError });
        throw new Error('Failed to join organization');
      }

      // Delete the invitation
      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('id', invitation.id);

      debugDatabase('Invitation accepted successfully', {
        userId: session.user.id,
        organizationId: invitation.organization_id,
        role: invitation.role
      });

      return {
        success: true,
        message: 'Successfully joined the organization',
        organizationSlug: invitation.organizations.slug
      };
    } catch (error) {
      logError(error, 'acceptInvitationAction');
      throw error;
    }
  });
