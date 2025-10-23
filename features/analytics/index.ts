// Analytics feature module
export const ANALYTICS_FEATURE = {
  name: 'Analytics',
  description: 'Usage tracking and analytics',
  enabled: false,
};

// Analytics components
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard';
export { default as UsageChart } from './components/UsageChart';
export { default as MetricsOverview } from './components/MetricsOverview';
