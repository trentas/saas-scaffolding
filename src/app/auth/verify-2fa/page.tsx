'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Background } from '@/components/background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Verify2FA() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (code.length !== 6) {
      setMessage('Please enter a 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setMessage(data.message || 'Invalid verification code');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('A new verification code has been sent to your email');
      } else {
        setMessage(data.message || 'Failed to resend code');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="text-center">
                <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
                <p className="text-muted-foreground">
                  Enter the 6-digit code sent to your email address.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  
                  {message && (
                    <p className={`text-sm ${message.includes('sent') ? 'text-green-500' : 'text-red-500'}`}>
                      {message}
                    </p>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </form>
                
                <div className="text-center mt-4">
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-sm"
                  >
                    {isResending ? 'Resending...' : "Didn't receive a code? Resend"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
}
