'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, X, RotateCcw, Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { resendInvitationAction, cancelInvitationAction } from '@/actions/team-actions';
import { PendingInvitation } from '@/actions/team-actions';
import { canResendInvitations, canCancelInvitations } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface PendingInvitationCardProps {
  invitation: PendingInvitation;
  currentUserRole: 'owner' | 'admin' | 'member';
  organizationId: string;
}

export function PendingInvitationCard({ 
  invitation, 
  currentUserRole, 
  organizationId
}: PendingInvitationCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatExpirationDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return t('team.invitationCard.expired');
    } else if (diffDays === 1) {
      return t('team.invitationCard.expiresIn', { days: 1 });
    } else {
      return t('team.invitationCard.expiresIn', { days: diffDays });
    }
  };

  const handleResendInvitation = async () => {
    setIsLoading(true);
    try {
      const result = await resendInvitationAction({
        invitationId: invitation.id,
        organizationId,
      });

      if (result?.data?.success) {
        toast.success(t('team.invitationCard.resendSuccess'));
      } else {
        toast.error(result?.data?.message || t('team.invitationCard.resendSuccess'));
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error instanceof Error ? error.message : t('team.invitationCard.resendSuccess'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    setIsLoading(true);
    try {
      const result = await cancelInvitationAction({
        invitationId: invitation.id,
        organizationId,
      });

      if (result?.data?.success) {
        toast.success(t('team.invitationCard.cancelSuccess'));
        setShowCancelDialog(false);
      } else {
        toast.error(result?.data?.message || t('team.invitationCard.cancelSuccess'));
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(error instanceof Error ? error.message : t('team.invitationCard.cancelSuccess'));
    } finally {
      setIsLoading(false);
    }
  };

  const canResend = canResendInvitations(currentUserRole);
  const canCancel = canCancelInvitations(currentUserRole);
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">{invitation.email}</h4>
            <p className="text-sm text-muted-foreground">
              {t('team.invitationCard.invitedBy')} {invitation.invitedByName}
            </p>
            <div className="flex gap-2 mt-1">
              <Badge variant={getRoleBadgeVariant(invitation.role)} className="text-xs">
                {t(`roles.${invitation.role}` as any)}
              </Badge>
              <Badge 
                variant={isExpired ? 'destructive' : 'secondary'} 
                className="text-xs"
              >
                {formatExpirationDate(invitation.expiresAt)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {new Date(invitation.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </span>
          {(canResend || canCancel) && (
            <div className="flex gap-1">
              {canResend && !isExpired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendInvitation}
                  disabled={isLoading}
                  title={t('team.invitationCard.resendButton')}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isLoading}
                  title={t('team.invitationCard.cancelButton')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.invitationCard.cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.invitationCard.cancelDialog.description', { email: invitation.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('team.invitationCard.cancelDialog.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
