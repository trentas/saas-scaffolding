export interface FeatureConfig {
  enabled: boolean;
  name: string;
  description: string;
  dependencies?: string[];
}

export const featuresConfig: Record<string, FeatureConfig> = {
  // Core features (always enabled)
  auth: {
    enabled: true,
    name: 'Authentication',
    description: 'User authentication and session management',
  },
  multiTenant: {
    enabled: true,
    name: 'Multi-tenant',
    description: 'Multi-tenant organization support',
  },
  userManagement: {
    enabled: true,
    name: 'User Management',
    description: 'User roles and permissions',
  },
  
  // Optional features
  billing: {
    enabled: false,
    name: 'Billing',
    description: 'Stripe billing and subscription management',
    dependencies: ['auth', 'multiTenant'],
  },
  analytics: {
    enabled: false,
    name: 'Analytics',
    description: 'Usage tracking and analytics',
    dependencies: ['multiTenant'],
  },
  notifications: {
    enabled: false,
    name: 'Notifications',
    description: 'Email and push notifications',
    dependencies: ['auth'],
  },
  apiKeys: {
    enabled: false,
    name: 'API Keys',
    description: 'API key management for integrations',
    dependencies: ['auth', 'multiTenant'],
  },
  webhooks: {
    enabled: false,
    name: 'Webhooks',
    description: 'Webhook system for integrations',
    dependencies: ['auth', 'multiTenant'],
  },
  custom: {
    enabled: false,
    name: 'Custom Features',
    description: 'Placeholder for custom feature modules',
    dependencies: ['auth', 'multiTenant'],
  },
};

export const getEnabledFeatures = (): string[] => {
  return Object.entries(featuresConfig)
    .filter(([_, config]) => config.enabled)
    .map(([key]) => key);
};

export const isFeatureEnabled = (feature: string): boolean => {
  return featuresConfig[feature]?.enabled || false;
};

export const getFeatureDependencies = (feature: string): string[] => {
  return featuresConfig[feature]?.dependencies || [];
};
