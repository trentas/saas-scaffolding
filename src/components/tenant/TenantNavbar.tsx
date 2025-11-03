'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import { useTenant } from './TenantProvider';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';
import { Badge } from '@/components/ui/badge';
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
  const { t } = useTranslation();

  // Get current organization info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organizations = (session?.user as any)?.organizations || [];
  const currentOrganization = organizations.find((org: any) => org.slug === tenant);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO_URL || '/logo.svg';
  const logoUrl = currentOrganization?.logo_url || defaultLogoUrl;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={currentOrganization ? `/${currentOrganization.slug}/dashboard` : '/'} className="flex-shrink-0">
            <Image
              src={logoUrl}
              alt={currentOrganization?.name || 'Logo'}
              width={120}
              height={24}
              className="h-6 w-auto"
              unoptimized
            />
          </Link>
          <OrganizationSwitcher currentOrganization={currentOrganization} />
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
              <DropdownMenuContent className="w-56" align="end" forceMount>
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
                    <DropdownMenuSeparator />
                  </>
                )}
                {(!currentOrganization || pathname === '/setup') && <DropdownMenuSeparator />}
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
