'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Background } from '@/components/background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateTenantSlug, isValidTenantSlug } from '@/lib/tenant';

export default function Setup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // If user already has organizations, redirect to dashboard
    if (session.user?.organizations?.length > 0) {
      const firstOrg = session.user.organizations[0];
      router.push(`/${firstOrg.slug}/dashboard`);
    }
  }, [session, status, router]);

  const handleOrganizationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = generateTenantSlug(name);
    setFormData({
      organizationName: name,
      organizationSlug: slug,
    });
  };

  const handleOrganizationSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({
      ...formData,
      organizationSlug: slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate organization name
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      setIsLoading(false);
      return;
    }

    // Validate slug
    if (!formData.organizationSlug || !isValidTenantSlug(formData.organizationSlug)) {
      setError('Organization slug must be 3-50 characters long and contain only letters, numbers, and hyphens');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.organizationName,
          slug: formData.organizationSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }

      const organization = await response.json();
      
      // Redirect to the new organization dashboard
      router.push(`/${organization.slug}/dashboard`);
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Background>
        <section className="py-28 lg:pt-44 lg:pb-32">
          <div className="container">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </div>
        </section>
      </Background>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-md">
              <CardHeader className="flex flex-col items-center space-y-0">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={94}
                  height={18}
                  className="mb-7 dark:invert"
                />
                <CardTitle className="text-2xl font-bold">Create your organization</CardTitle>
                <p className="text-muted-foreground text-center">
                  Let's set up your organization to get started.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="My Company"
                      value={formData.organizationName}
                      onChange={handleOrganizationNameChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="organizationSlug">Organization URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">app.com/</span>
                      <Input
                        id="organizationSlug"
                        type="text"
                        placeholder="my-company"
                        value={formData.organizationSlug}
                        onChange={handleOrganizationSlugChange}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your organization's unique URL. You can change it later.
                    </p>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating organization...' : 'Create organization'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
}
