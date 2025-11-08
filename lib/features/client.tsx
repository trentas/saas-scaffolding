'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';

import {
  FeatureFlagMap,
  FeatureKey,
  resolveFeatureFlags,
} from '@/lib/features';

const FeatureFlagsContext = createContext<FeatureFlagMap | null>(null);

export function FeatureFlagsProvider({
  children,
  initialFlags,
}: {
  children: ReactNode;
  initialFlags?: FeatureFlagMap;
}) {
  const value = useMemo(
    () => initialFlags ?? resolveFeatureFlags(),
    [initialFlags],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagMap {
  const context = useContext(FeatureFlagsContext);
  return context ?? resolveFeatureFlags();
}

export function useFeatureEnabled(feature: FeatureKey): boolean {
  const flags = useFeatureFlags();
  return flags[feature]?.enabled ?? false;
}

export function useFeature(feature: FeatureKey) {
  const flags = useFeatureFlags();
  return flags[feature];
}


