import { cache } from 'react';

import {
  FeatureFlagMap,
  FeatureKey,
  getFeatureFlag,
  isFeatureEnabled,
  resolveFeatureFlags,
} from '@/lib/features';

export const getServerFeatureFlags = cache((): FeatureFlagMap => {
  return resolveFeatureFlags();
});

export function isServerFeatureEnabled(feature: FeatureKey): boolean {
  const flags = getServerFeatureFlags();
  return isFeatureEnabled(feature, flags);
}

export function getServerFeatureFlag(feature: FeatureKey) {
  const flags = getServerFeatureFlags();
  return getFeatureFlag(feature, flags);
}

