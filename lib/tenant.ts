import { headers } from 'next/headers';

import { TenantContext } from './tenant-utils';

/**
 * Extract tenant information from the request (Server-side only)
 * Supports both subdomain routing (company.app.com) and path routing (app.com/company)
 */
export async function getTenantFromRequest(): Promise<TenantContext> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const pathname = headersList.get('x-pathname') || '';
  
  // Remove port from hostname
  const hostname = host.split(':')[0];
  
  // Check if it's a subdomain (e.g., company.app.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // Assume the first part is the tenant subdomain
    const tenant = parts[0];
    const domain = parts.slice(1).join('.');
    
    // Skip if it's localhost or IP address
    if (tenant !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return {
        tenant,
        isSubdomain: true,
        hostname: domain,
      };
    }
  }
  
  // Check for path-based routing (e.g., /company/dashboard)
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const tenant = pathParts[0];
    return {
      tenant,
      isSubdomain: false,
      hostname,
    };
  }
  
  return {
    tenant: null,
    isSubdomain: false,
    hostname,
  };
}

/**
 * Check if user has access to tenant
 */
export async function checkTenantAccess(
  tenant: string,
  userId: string
): Promise<{ hasAccess: boolean; role?: string }> {
  try {
    const { supabaseAdmin } = await import('./supabase');
    
    // Get organization by slug
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', tenant)
      .single();
    
    if (orgError || !org) {
      return { hasAccess: false };
    }
    
    // Check user membership
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('role, status')
      .eq('user_id', userId)
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .single();
    
    if (memberError || !membership) {
      return { hasAccess: false };
    }
    
    return { hasAccess: true, role: membership.role };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking tenant access:', error);
    return { hasAccess: false };
  }
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string) {
  try {
    const { supabaseAdmin } = await import('./supabase');
    
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        role,
        status,
        organizations (
          id,
          name,
          slug,
          plan
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      throw error;
    }
    
    return data?.map(member => ({
      ...member.organizations,
      role: member.role,
    })) || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting user organizations:', error);
    return [];
  }
}
