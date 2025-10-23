import { headers } from 'next/headers';

export interface TenantContext {
  tenant: string | null;
  isSubdomain: boolean;
  hostname: string;
}

/**
 * Extract tenant information from the request
 * Supports both subdomain routing (company.app.com) and path routing (app.com/company)
 */
export function getTenantFromRequest(): TenantContext {
  const headersList = headers();
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
 * Generate URLs for tenant-specific routes
 */
export function getTenantUrl(tenant: string, path: string = '', isSubdomain: boolean = true): string {
  if (isSubdomain) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const domain = new URL(baseUrl).hostname;
    return `https://${tenant}.${domain}${path}`;
  } else {
    return `/${tenant}${path}`;
  }
}

/**
 * Validate tenant slug format
 */
export function isValidTenantSlug(slug: string): boolean {
  // Allow alphanumeric characters and hyphens, 3-50 characters
  const slugRegex = /^[a-zA-Z0-9-]{3,50}$/;
  return slugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
}

/**
 * Generate a unique tenant slug from organization name
 */
export function generateTenantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
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
    console.error('Error getting user organizations:', error);
    return [];
  }
}
