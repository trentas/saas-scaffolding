'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useSession } from 'next-auth/react';
import { Background } from '@/components/background';

export default function PostLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/signin');
      return;
    }

    const inviteToken = searchParams?.get('invite');
    const redirectTo = searchParams?.get('redirect');

    if (inviteToken) {
      router.replace(`/accept-invite?token=${encodeURIComponent(inviteToken)}`);
      return;
    }

    if (redirectTo) {
      const isFullUrl = /^https?:\/\//i.test(redirectTo);
      const target = isFullUrl ? redirectTo : `${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`;
      router.replace(target);
      return;
    }

    const finalizeLogin = async () => {
      try {
        const response = await fetch('/api/auth/get-user-orgs', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const { organizations } = await response.json();

          if (Array.isArray(organizations) && organizations.length > 0) {
            const firstOrg = organizations[0];
            router.replace(`/${firstOrg.slug}/dashboard`);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to resolve post-login redirect:', error);
      }

      router.replace('/setup');
    };

    finalizeLogin();
  }, [session, status, router, searchParams]);

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6" />
              <p className="text-sm text-muted-foreground">
                Preparando sua conta...
              </p>
            </div>
          </div>
        </div>
      </section>
    </Background>
  );
}

