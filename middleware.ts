import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantFromRequest } from './lib/tenant';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/setup') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  const tenantContext = await getTenantFromRequest();
  
  // If no tenant detected and not on root pages, continue
  if (!tenantContext.tenant && !pathname.startsWith('/')) {
    return NextResponse.next();
  }
  
  // If tenant detected, rewrite to tenant route
  if (tenantContext.tenant) {
    const tenantPath = `/${tenantContext.tenant}${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = tenantPath;
    
    // Add tenant context to headers for use in components
    const response = NextResponse.rewrite(url);
    response.headers.set('x-tenant', tenantContext.tenant);
    response.headers.set('x-is-subdomain', tenantContext.isSubdomain.toString());
    response.headers.set('x-pathname', pathname);
    
    return response;
  }
  
  // For root domain requests, check if user needs to create organization
  if (pathname === '/' || pathname === '/dashboard') {
    // This will be handled by the auth system
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
