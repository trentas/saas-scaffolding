// Webhooks feature module
export const WEBHOOKS_FEATURE = {
  name: 'Webhooks',
  description: 'Webhook system for integrations',
  enabled: false,
};

// Webhook components
export { default as WebhooksDashboard } from './components/WebhooksDashboard';
export { default as CreateWebhook } from './components/CreateWebhook';
export { default as WebhookList } from './components/WebhookList';
