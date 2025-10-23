// API Keys feature module
export const API_KEYS_FEATURE = {
  name: 'API Keys',
  description: 'API key management for integrations',
  enabled: false,
};

// API Key components
export { default as ApiKeysDashboard } from './components/ApiKeysDashboard';
export { default as CreateApiKey } from './components/CreateApiKey';
export { default as ApiKeyList } from './components/ApiKeyList';
