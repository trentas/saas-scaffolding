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
  ScrollText,
} from 'lucide-react';

import { useTenant } from './TenantProvider';

import { useTranslation } from '@/hooks/useTranslation';
import type { FeatureKey } from '@/lib/features';
import { useFeatureFlags } from '@/lib/features/client';
import { cn } from '@/lib/utils';

interface NavItem {
  translationKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  featureKey?: FeatureKey;
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
    featureKey: 'stripeSupport',
  },
  {
    translationKey: 'navigation.analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['owner', 'admin'],
    featureKey: 'analytics',
  },
  {
    translationKey: 'navigation.auditLog',
    href: '/audit-log',
    icon: ScrollText,
    roles: ['owner', 'admin'],
    featureKey: 'auditLog',
  },
  {
    translationKey: 'navigation.apiKeys',
    href: '/api-keys',
    icon: Key,
    roles: ['owner', 'admin'],
    featureKey: 'apiKeys',
  },
  {
    translationKey: 'navigation.webhooks',
    href: '/webhooks',
    icon: Webhook,
    roles: ['owner', 'admin'],
    featureKey: 'webhooks',
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
  const featureFlags = useFeatureFlags();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles.includes(role)) {
      return false;
    }

    if (!item.featureKey) {
      return true;
    }

    return featureFlags[item.featureKey]?.enabled ?? false;
  });

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
