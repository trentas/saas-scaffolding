// Billing feature module
export { STRIPE_CONFIG, createStripeCustomer, createSubscription } from '../../lib/stripe';

export const BILLING_FEATURE = {
  name: 'Billing',
  description: 'Stripe billing and subscription management',
  enabled: true,
};

// Billing components
export { default as BillingDashboard } from './components/BillingDashboard';
