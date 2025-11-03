'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, UserMinus, Shield, ShieldCheck, Crown, Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { removeMemberAction, updateMemberRoleAction } from '@/actions/team-actions';
import { TeamMember } from '@/actions/team-actions';
import { canChangeRoles, canRemoveMembers } from '@/lib/permissions';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserRole: 'owner' | 'admin' | 'member';
  currentUserId: string;
  organizationId: string;
}

export function TeamMemberCard({ 
  member, 
  currentUserRole, 
  currentUserId,
  organizationId
}: TeamMemberCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleRoleChange = async (newRole: 'admin' | 'member') => {
    if (newRole === member.role) return;

    setIsLoading(true);
    try {
      const result = await updateMemberRoleAction({
        memberId: member.id,
        role: newRole,
        organizationId,
      });

      if (result?.data?.success) {
        toast.success(t('team.changeRoleDialog.success'));
      } else {
        toast.error(result?.data?.message || t('team.changeRoleDialog.error'));
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error(error instanceof Error ? error.message : t('team.changeRoleDialog.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    setIsLoading(true);
    try {
      const result = await removeMemberAction({
        memberId: member.id,
        organizationId,
      });

      if (result?.data?.success) {
        toast.success(t('team.removeDialog.success'));
        setShowRemoveDialog(false);
      } else {
        toast.error(result?.data?.message || t('team.removeDialog.error'));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : t('team.removeDialog.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const canChangeRole = canChangeRoles(currentUserRole);
  // Owner cannot remove themselves
  const canRemove = canRemoveMembers(currentUserRole, member.role) && 
                    !(currentUserRole === 'owner' && member.userId === currentUserId);
  
  // Check if transfer ownership option is available
  const canTransferOwnership = currentUserRole === 'owner' && member.role !== 'owner';
  
  // Only show menu if there are any actions available
  const hasActions = canTransferOwnership || (canChangeRole && member.role !== 'owner') || canRemove;

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            {(() => {
              const avatarUrl = getUserAvatarUrl(member.avatarUrl || null, member.email, 40);
              return avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={member.name} />
              ) : null;
            })()}
            <AvatarFallback>
              {member.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{member.name}</h4>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                {t(`roles.${member.role}` as any)}
              </Badge>
              <Badge variant="default" className="text-xs">
                {member.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('team.joinedAt')} {new Date(member.joinedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </span>
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canTransferOwnership && (
                  <TransferOwnershipDialog member={member} organizationId={organizationId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Crown className="mr-2 h-4 w-4" />
                      {t('team.transferOwnership')}
                    </DropdownMenuItem>
                  </TransferOwnershipDialog>
                )}
                {canChangeRole && member.role !== 'owner' && (
                  <>
                    {member.role === 'member' && (
                      <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        {t('team.changeRoleDialog.changeButton')} {t('roles.admin')}
                      </DropdownMenuItem>
                    )}
                    {member.role === 'admin' && (
                      <DropdownMenuItem onClick={() => handleRoleChange('member')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t('team.changeRoleDialog.demoteButton')} {t('roles.member')}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {canRemove && (
                  <DropdownMenuItem 
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-red-600"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    {t('team.removeMember')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.removeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.removeDialog.description', { name: member.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('team.removeDialog.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
