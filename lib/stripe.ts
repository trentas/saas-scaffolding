import Stripe from 'stripe';

import { logger } from './debug';
import { env } from './env';
import { supabaseAdmin } from './supabase';

// Initialize Stripe (lazy to avoid build-time errors when env var is not set)
function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
}

let _stripe: Stripe | null = null;
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) _stripe = getStripeClient();
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Stripe configuration
export const STRIPE_CONFIG = {
  plans: {
    free: {
      name: 'Free',
      price: 0,
      features: [
        'Up to 5 team members',
        'Basic support',
        '1 organization',
      ],
    },
    pro: {
      name: 'Pro',
      price: 29,
      priceId: env.STRIPE_PRO_PRICE_ID,
      features: [
        'Unlimited team members',
        'Priority support',
        'Unlimited organizations',
        'Advanced analytics',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: 99,
      priceId: env.STRIPE_ENTERPRISE_PRICE_ID,
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
      ],
    },
  },
};

// Create Stripe customer
export async function createStripeCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer', { error });
    throw error;
  }
}

// Create subscription
export async function createSubscription(
  customerId: string,
  priceId: string,
  organizationId: string
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in database
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan: 'pro', // Determine plan from priceId
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : new Date().toISOString(),
      });

    return subscription;
  } catch (error) {
    logger.error('Error creating subscription', { error });
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update subscription in database
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscription.status,
      })
      .eq('stripe_subscription_id', subscriptionId);

    return subscription;
  } catch (error) {
    logger.error('Error canceling subscription', { error });
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error('Error retrieving subscription', { error });
    throw error;
  }
}

// Create billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    logger.error('Error creating billing portal session', { error });
    throw error;
  }
}

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    logger.error('Error creating checkout session', { error });
    throw error;
  }
}

// Handle webhook events
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    logger.error('Error handling webhook', { error });
    throw error;
  }
}

// Handle subscription changes
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan: 'pro', // Determine plan from subscription
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : new Date().toISOString(),
      });
  } catch (error) {
    logger.error('Error updating subscription', { error });
    throw error;
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
      })
      .eq('stripe_subscription_id', subscription.id);
  } catch (error) {
    logger.error('Error updating canceled subscription', { error });
    throw error;
  }
}

// Extract subscription ID from invoice parent
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    if (subscriptionId) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
        })
        .eq('stripe_subscription_id', subscriptionId);
    }
  } catch (error) {
    logger.error('Error updating payment status (succeeded)', { error });
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    if (subscriptionId) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
        })
        .eq('stripe_subscription_id', subscriptionId);
    }
  } catch (error) {
    logger.error('Error updating payment status (failed)', { error });
    throw error;
  }
}
