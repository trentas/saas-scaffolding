'use client';

import { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  tenant: string;
  role: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  tenant: string;
  role: string;
}

export function TenantProvider({ children, tenant, role }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenant, role }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
