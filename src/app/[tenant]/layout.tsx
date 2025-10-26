import { notFound, redirect } from 'next/navigation';

import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';

import { TenantNavbar } from '@/components/tenant/TenantNavbar';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { TenantSidebar } from '@/components/tenant/TenantSidebar';
import { debugDatabase } from '@/lib/debug';
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
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  const { tenant } = await params;
  
  // Get the JWT token to access the user ID
  const token = await getToken({ req: { headers: {} } as any });
  
  // Check if user has access to this tenant
  debugDatabase('Session object received', { 
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
    userId: session?.user?.id,
    sessionKeys: Object.keys(session || {}),
    userKeys: Object.keys(session?.user || {}),
    tokenSub: token?.sub,
    tokenId: token?.id
  });
  
  // Use token.sub as the userId since session.user.id is not persisted
  const userId = token?.sub || '';
  
  debugDatabase('Tenant layout access check', { 
    tenant, 
    userId, 
    userEmail: session.user?.email 
  });
  
  const { hasAccess, role } = await checkTenantAccess(tenant, userId);
  
  debugDatabase('Tenant access result', { 
    tenant, 
    userId, 
    hasAccess, 
    role 
  });
  
  if (!hasAccess) {
    debugDatabase('Access denied - returning 404', { tenant, userId });
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
