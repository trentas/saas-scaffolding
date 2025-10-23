// Notifications feature module
export const NOTIFICATIONS_FEATURE = {
  name: 'Notifications',
  description: 'Email and push notifications',
  enabled: false,
};

// Notification components
export { default as NotificationsDashboard } from './components/NotificationsDashboard';
export { default as EmailSettings } from './components/EmailSettings';
export { default as NotificationHistory } from './components/NotificationHistory';
