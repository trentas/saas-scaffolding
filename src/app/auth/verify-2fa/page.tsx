'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Background } from '@/components/background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrowserTranslation } from '@/hooks/useBrowserTranslation';

export default function Verify2FA() {
  const { t } = useBrowserTranslation();
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
      setMessage(t('auth.verify2fa.invalidCode'));
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
        setMessage(data.message || t('auth.verify2fa.invalidCode'));
      }
    } catch {
      setMessage(t('auth.verify2fa.error'));
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
        setMessage(t('auth.verify2fa.verifying'));
      } else {
        setMessage(data.message || t('auth.verify2fa.error'));
      }
    } catch {
      setMessage(t('auth.verify2fa.error'));
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
                <h1 className="text-2xl font-bold">{t('auth.verify2fa.title')}</h1>
                <p className="text-muted-foreground">
                  {t('auth.verify2fa.subtitle')}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">{t('auth.verify2fa.code')}</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder={t('auth.verify2fa.codePlaceholder')}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  
                  {message && (
                    <p className={`text-sm ${message.includes('sent') || message.includes('enviado') ? 'text-green-500' : 'text-red-500'}`}>
                      {message}
                    </p>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('auth.verify2fa.verifying') : t('auth.verify2fa.verifyButton')}
                  </Button>
                </form>
                
                <div className="text-center mt-4">
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-sm"
                  >
                    {isResending ? t('auth.verify2fa.verifying') : t('auth.verify2fa.resendCode')}
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
