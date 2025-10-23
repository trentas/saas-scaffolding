'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from './TenantProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Settings,
  BarChart3,
  Key,
  Webhook,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'admin', 'member'],
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users,
    roles: ['owner', 'admin'],
  },
  {
    title: 'Invite',
    href: '/invite',
    icon: UserPlus,
    roles: ['owner', 'admin'],
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: CreditCard,
    roles: ['owner'],
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['owner', 'admin'],
  },
  {
    title: 'API Keys',
    href: '/api-keys',
    icon: Key,
    roles: ['owner', 'admin'],
  },
  {
    title: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
    roles: ['owner', 'admin'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['owner', 'admin'],
  },
];

export function TenantSidebar() {
  const { tenant, role } = useTenant();
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-background">
      <div className="p-4">
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
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
