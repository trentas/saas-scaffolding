export interface TenantContext {
  tenant: string | null;
  isSubdomain: boolean;
  hostname: string;
}

/**
 * Extract tenant information from URL (Client-side compatible)
 * Supports both subdomain routing (company.app.com) and path routing (app.com/company)
 */
export function getTenantFromUrl(url?: string): TenantContext {
  if (typeof window === 'undefined' && !url) {
    return {
      tenant: null,
      isSubdomain: false,
      hostname: '',
    };
  }

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const urlObj = new URL(currentUrl);
  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname;
  
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
