'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Key,
  Webhook,
  User,
} from 'lucide-react';

import { useTenant } from './TenantProvider';
import { useTranslation } from '@/hooks/useTranslation';

import { cn } from '@/lib/utils';

interface NavItem {
  translationKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    translationKey: 'navigation.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'admin', 'member'],
  },
  {
    translationKey: 'navigation.team',
    href: '/team',
    icon: Users,
    roles: ['owner', 'admin'],
  },
  {
    translationKey: 'navigation.billing',
    href: '/billing',
    icon: CreditCard,
    roles: ['owner'],
  },
  {
    translationKey: 'navigation.analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['owner', 'admin'],
  },
  {
    translationKey: 'navigation.apiKeys',
    href: '/api-keys',
    icon: Key,
    roles: ['owner', 'admin'],
  },
  {
    translationKey: 'navigation.webhooks',
    href: '/webhooks',
    icon: Webhook,
    roles: ['owner', 'admin'],
  },
  {
    translationKey: 'navigation.profile',
    href: '/profile',
    icon: User,
    roles: ['owner', 'admin', 'member'],
  },
];

export function TenantSidebar() {
  const { tenant, role } = useTenant();
  const pathname = usePathname();
  const { t } = useTranslation();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === `/${tenant}${item.href}`;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={`/${tenant}${item.href}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.translationKey)}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
