'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, Building2, Plus } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import { useTenant } from './TenantProvider';
import { useTranslation } from '@/hooks/useTranslation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TenantNavbar() {
  const { data: session } = useSession();
  const { tenant, role } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  // Get current organization info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organizations = (session?.user as any)?.organizations || [];
  const currentOrganization = organizations.find((org: any) => org.slug === tenant);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleOrganizationChange = (orgSlug: string) => {
    // Extract the current path without the organization prefix
    const pathWithoutOrg = pathname.replace(/^\/[^\/]+/, '');
    const newPath = `/${orgSlug}${pathWithoutOrg}`;
    router.push(newPath);
  };

  const handleCreateOrganization = () => {
    router.push('/setup');
  };

  const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO_URL || '/logo.svg';
  const logoUrl = currentOrganization?.logo_url || defaultLogoUrl;

  const showOrganizationsSection = organizations.length > 0 || pathname === '/setup';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 pl-3">
          <Link href={currentOrganization ? `/${currentOrganization.slug}/dashboard` : '/'} className="flex-shrink-0 max-w-[calc(16rem-12px)]">
            <Image
              src={logoUrl}
              alt={currentOrganization?.name || 'Logo'}
              width={120}
              height={24}
              className="h-6 w-auto max-w-full object-contain"
              unoptimized
            />
          </Link>
          {/* Organization name/role badge */}
          {currentOrganization && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{currentOrganization.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                ({t(`roles.${currentOrganization.role}` as any)})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {(() => {
                      const avatarUrl = getUserAvatarUrl(
                        session.user.image || null,
                        session.user.email || '',
                        32
                      );
                      return avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={session.user.name || ''} />
                      ) : null;
                    })()}
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                {pathname !== '/setup' && tenant !== 'setup' && currentOrganization && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${currentOrganization.slug}/profile`}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('navigation.profileAndSettings')}</span>
                      </Link>
                    </DropdownMenuItem>
                    {(role === 'owner' || role === 'admin') && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${currentOrganization.slug}/settings`}>
                          <Building2 className="mr-2 h-4 w-4" />
                          <span>{t('navigation.organizationSettings')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {showOrganizationsSection && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('navigation.organizations')}
                      </p>
                    </div>
                    
                    {organizations.map((org: any) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleOrganizationChange(org.slug)}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            <Building2 className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start flex-1">
                          <span className="text-sm font-medium">{org.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {t(`roles.${org.role}` as any)}
                          </span>
                        </div>
                        {currentOrganization && org.slug === currentOrganization.slug && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuItem
                      onClick={handleCreateOrganization}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          <Plus className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{t('navigation.createOrganization')}</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('navigation.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
