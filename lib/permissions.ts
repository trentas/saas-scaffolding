export type UserRole = 'owner' | 'admin' | 'member';

export interface Permission {
  resource: string;
  action: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Define permissions for each role
export const rolePermissions: RolePermissions[] = [
  {
    role: 'owner',
    permissions: [
      // Organization management
      { resource: 'organization', action: 'read' },
      { resource: 'organization', action: 'update' },
      { resource: 'organization', action: 'delete' },
      { resource: 'organization', action: 'billing' },
      
      // User management
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'users', action: 'invite' },
      
      // Feature management
      { resource: 'features', action: 'read' },
      { resource: 'features', action: 'update' },
      
      // Analytics and reports
      { resource: 'analytics', action: 'read' },
      { resource: 'reports', action: 'read' },
    ],
  },
  {
    role: 'admin',
    permissions: [
      // Organization management (limited)
      { resource: 'organization', action: 'read' },
      { resource: 'organization', action: 'update' },
      
      // User management (limited)
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'invite' },
      
      // Feature management (read-only)
      { resource: 'features', action: 'read' },
      
      // Analytics and reports
      { resource: 'analytics', action: 'read' },
      { resource: 'reports', action: 'read' },
    ],
  },
  {
    role: 'member',
    permissions: [
      // Organization management (read-only)
      { resource: 'organization', action: 'read' },
      
      // User management (read-only)
      { resource: 'users', action: 'read' },
      
      // Feature management (read-only)
      { resource: 'features', action: 'read' },
    ],
  },
];

/**
 * Check if a role has permission for a specific resource and action
 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: string
): boolean {
  const rolePermission = rolePermissions.find(rp => rp.role === role);
  if (!rolePermission) return false;
  
  return rolePermission.permissions.some(
    permission => permission.resource === resource && permission.action === action
  );
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const rolePermission = rolePermissions.find(rp => rp.role === role);
  return rolePermission?.permissions || [];
}

/**
 * Check if user can perform action on resource
 */
export function canUserPerformAction(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  return hasPermission(userRole, resource, action);
}

/**
 * Get accessible routes for a role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  const permissions = getRolePermissions(role);
  const routes: string[] = ['/dashboard', '/profile'];
  
  // Add routes based on permissions
  permissions.forEach(permission => {
    switch (permission.resource) {
      case 'users':
        if (permission.action === 'read' && !routes.includes('/team')) {
          routes.push('/team');
        }
        if (permission.action === 'invite' && !routes.includes('/invite')) {
          routes.push('/invite');
        }
        break;
      case 'organization':
        if (permission.action === 'update' && !routes.includes('/settings')) {
          routes.push('/settings');
        }
        if (permission.action === 'billing' && !routes.includes('/billing')) {
          routes.push('/billing');
        }
        break;
      case 'analytics':
        if (permission.action === 'read' && !routes.includes('/analytics')) {
          routes.push('/analytics');
        }
        break;
    }
  });
  
  return routes;
}

/**
 * Middleware helper to check permissions
 */
export function requirePermission(
  role: UserRole,
  resource: string,
  action: string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      if (!hasPermission(role, resource, action)) {
        throw new Error(`Insufficient permissions: ${role} cannot ${action} ${resource}`);
      }
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
