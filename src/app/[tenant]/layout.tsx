import { notFound, redirect } from 'next/navigation';

import { getServerSession } from 'next-auth';

import { TenantNavbar } from '@/components/tenant/TenantNavbar';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { TenantSidebar } from '@/components/tenant/TenantSidebar';
import { authOptions } from '@/lib/auth';
import { checkTenantAccess } from '@/lib/tenant';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const { tenant } = await params;

  // Check if user has access to this tenant
  const { hasAccess, role } = await checkTenantAccess(tenant, session.user.id);
  
  if (!hasAccess) {
    notFound();
  }

  return (
    <TenantProvider tenant={tenant} role={role || 'member'}>
      <div className="min-h-screen bg-background">
        <TenantNavbar />
        <div className="flex">
          <TenantSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
