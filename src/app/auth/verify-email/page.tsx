'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Background } from '@/components/background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const verifyEmail = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token, verifyEmail]);

  const handleContinue = () => {
    router.push('/auth/signin');
  };

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="text-center">
                <h1 className="text-2xl font-bold">
                  {status === 'verifying' && 'Verifying Email...'}
                  {status === 'success' && 'Email Verified!'}
                  {status === 'error' && 'Verification Failed'}
                </h1>
              </CardHeader>
              <CardContent className="text-center">
                {status === 'verifying' && (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">
                      Please wait while we verify your email address...
                    </p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="space-y-4">
                    <div className="text-green-500 text-4xl">✓</div>
                    <p className="text-muted-foreground">{message}</p>
                    <Button onClick={handleContinue} className="w-full">
                      Continue to Sign In
                    </Button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-4">
                    <div className="text-red-500 text-4xl">✗</div>
                    <p className="text-muted-foreground">{message}</p>
                    <Button onClick={() => router.push('/auth/signup')} variant="outline" className="w-full">
                      Back to Sign Up
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
