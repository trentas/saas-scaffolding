'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { signIn, getSession } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

import { Background } from '@/components/background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrowserTranslation } from '@/hooks/useBrowserTranslation';

export default function SignIn() {
  const { t } = useBrowserTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('verify your email')) {
          setError(t('auth.signin.emailNotVerified'));
        } else if (result.error.includes('locked')) {
          setError(t('auth.signin.accountLocked'));
        } else {
          setError(t('auth.signin.invalidCredentials'));
        }
      } else {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch organizations directly from API to avoid session cache issues
        try {
          const orgResponse = await fetch('/api/auth/get-user-orgs', {
            method: 'GET',
            credentials: 'include',
          });

          if (orgResponse.ok) {
            const { organizations } = await orgResponse.json();
            
            if (organizations && organizations.length > 0) {
              // If user came from invitation, redirect to accept invite first
              if (inviteToken) {
                window.location.href = `/accept-invite?token=${inviteToken}`;
                return;
              } else {
                // Redirect to first organization dashboard
                const firstOrg = organizations[0];
                window.location.href = `/${firstOrg.slug}/dashboard`;
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching organizations:', error);
        }
        
        // If no organizations found or error, redirect to setup
        if (inviteToken) {
          window.location.href = `/accept-invite?token=${inviteToken}`;
        } else {
          window.location.href = '/setup';
        }
      }
    } catch {
      setError(t('auth.signin.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Preserve invite token in callback URL
      const callbackUrl = inviteToken ? `/accept-invite?token=${inviteToken}` : '/setup';
      await signIn('google', { callbackUrl });
    } catch {
      setError(t('auth.signin.googleError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="flex flex-col items-center space-y-0">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={94}
                  height={18}
                  className="mb-7 dark:invert"
                />
                <p className="mb-2 text-2xl font-bold">{t('auth.signin.title')}</p>
                <p className="text-muted-foreground">
                  {t('auth.signin.subtitle')}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('auth.signin.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.signin.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('auth.signin.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('auth.signin.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="border-muted-foreground"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('auth.signin.rememberMe')}
                      </label>
                    </div>
                    <Link href="/auth/forgot-password" className="text-primary text-sm font-medium">
                      {t('auth.signin.forgotPassword')}
                    </Link>
                  </div>
                  {error && (
                    <div className="text-sm text-red-500">
                      <p>{error}</p>
                      {error.includes('verify your email') && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/auth/resend-verification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email }),
                              });
                              const data = await response.json();
                              if (response.ok) {
                                setError(t('auth.signin.verificationSent'));
                              } else {
                                setError(data.message || t('auth.signin.resendError'));
                              }
                            } catch {
                              setError(t('auth.signin.resendError'));
                            }
                          }}
                          className="text-primary hover:underline mt-1"
                        >
                          {t('auth.signin.resendVerification')}
                        </button>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
                    {isLoading ? t('auth.signin.signingIn') : t('auth.signin.signInButton')}
                  </Button>
                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <FcGoogle className="mr-2 size-5" />
                      {t('auth.signin.signInWithGoogle')}
                    </Button>
                  )}
                </form>
                <div className="text-muted-foreground mx-auto mt-8 flex justify-center gap-1 text-sm">
                  <p>{t('auth.signin.noAccount')}</p>
                  <Link href="/auth/signup" className="text-primary font-medium">
                    {t('auth.signin.signUp')}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
}
