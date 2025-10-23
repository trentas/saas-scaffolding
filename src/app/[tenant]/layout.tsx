import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTenantAccess } from '@/lib/tenant';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { TenantNavbar } from '@/components/tenant/TenantNavbar';
import { TenantSidebar } from '@/components/tenant/TenantSidebar';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has access to this tenant
  const { hasAccess, role } = await checkTenantAccess(params.tenant, session.user.id);
  
  if (!hasAccess) {
    notFound();
  }

  return (
    <TenantProvider tenant={params.tenant} role={role}>
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
