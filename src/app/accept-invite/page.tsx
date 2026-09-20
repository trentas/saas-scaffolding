'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { acceptInvitationAction } from '@/actions/team-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AcceptInvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    organizationSlug?: string;
  } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    // A missing token is handled by the `if (!token)` render guard below, which
    // shows a dedicated "Invalid Invitation" card, so there is no state to set.
    if (!token) {
      return;
    }

    if (status === 'loading') {
      return; // Still loading session
    }

    if (status === 'unauthenticated') {
      // User not logged in, redirect to signup with invite token
      router.push(`/auth/signup?invite=${token}`);
      return;
    }

    // User is logged in, process the invitation
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    // Kept inside an async closure so the state updates happen when the action
    // resolves rather than synchronously while the effect is running.
    let cancelled = false;

    void (async () => {
      setIsProcessing(true);
      try {
        const result = await acceptInvitationAction({ token });
        if (cancelled) return;

        if (result?.data?.success) {
          setResult({
            success: true,
            message: result.data.message,
            organizationSlug: result.data.organizationSlug
          });

          // Redirect to organization dashboard after 2 seconds
          setTimeout(() => {
            const organizationSlug = result.data?.organizationSlug;
            if (organizationSlug) {
              router.push(`/${organizationSlug}/dashboard`);
            } else {
              router.push('/dashboard');
            }
          }, 2000);
        } else {
          setResult({
            success: false,
            message: result?.data?.message || 'Failed to accept invitation'
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error accepting invitation:', error);
        setResult({
          success: false,
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, status, session, router]);

  const handleSignIn = () => {
    if (token) {
      router.push(`/auth/signin?invite=${token}`);
    } else {
      router.push('/auth/signin');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                No invitation token found in the URL.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Processing Invitation</CardTitle>
            <CardDescription className="text-center">
              Please wait while we process your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {result.success ? 'Invitation Accepted!' : 'Invitation Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {result.success 
                ? 'You have successfully joined the organization.' 
                : 'There was an issue processing your invitation.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
            
            {result.success && result.organizationSlug ? (
              <Button 
                onClick={() => router.push(`/${result.organizationSlug}/dashboard`)} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={() => router.push('/')} className="w-full">
                  Go to Homepage
                </Button>
                <Button onClick={handleSignIn} variant="outline" className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

function AcceptInviteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Loading invitation...</CardTitle>
          <CardDescription className="text-center">
            We are preparing your invitation details. Hold on a moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInvitePageContent />
    </Suspense>
  );
}
