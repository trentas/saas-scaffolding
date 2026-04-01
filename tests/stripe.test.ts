import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Mock stripe SDK
const mockCustomersCreate = vi.fn();
const mockSubscriptionsCreate = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      customers = { create: mockCustomersCreate };
      subscriptions = {
        create: mockSubscriptionsCreate,
        cancel: mockSubscriptionsCancel,
        retrieve: mockSubscriptionsRetrieve,
      };
      billingPortal = { sessions: { create: mockBillingPortalSessionsCreate } };
      checkout = { sessions: { create: mockCheckoutSessionsCreate } };
      webhooks = { constructEvent: vi.fn() };
    },
  };
});

// Set env before importing stripe module
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

import {
  STRIPE_CONFIG,
  createStripeCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  createBillingPortalSession,
  createCheckoutSession,
  handleStripeWebhook,
} from '@/lib/stripe';

describe('STRIPE_CONFIG', () => {
  it('defines free, pro, and enterprise plans', () => {
    expect(STRIPE_CONFIG.plans.free.price).toBe(0);
    expect(STRIPE_CONFIG.plans.pro.price).toBe(29);
    expect(STRIPE_CONFIG.plans.enterprise.price).toBe(99);
  });

  it('free plan has features', () => {
    expect(STRIPE_CONFIG.plans.free.features.length).toBeGreaterThan(0);
  });
});

describe('createStripeCustomer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls stripe.customers.create with email and name', async () => {
    const mockCustomer = { id: 'cus_123', email: 'a@b.com' };
    mockCustomersCreate.mockResolvedValue(mockCustomer);

    const result = await createStripeCustomer('a@b.com', 'Test');
    expect(mockCustomersCreate).toHaveBeenCalledWith({ email: 'a@b.com', name: 'Test' });
    expect(result).toEqual(mockCustomer);
  });

  it('throws on stripe error', async () => {
    mockCustomersCreate.mockRejectedValue(new Error('Stripe error'));
    await expect(createStripeCustomer('a@b.com', 'Test')).rejects.toThrow('Stripe error');
  });
});

describe('createSubscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates subscription and stores in database', async () => {
    const mockSub = {
      id: 'sub_123',
      status: 'active',
      items: { data: [{ current_period_end: 1700000000 }] },
    };
    mockSubscriptionsCreate.mockResolvedValue(mockSub);

    const result = await createSubscription('cus_123', 'price_123', 'org_123');
    expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_123' })
    );
    expect(result).toEqual(mockSub);
  });
});

describe('cancelSubscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cancels subscription via stripe', async () => {
    mockSubscriptionsCancel.mockResolvedValue({ id: 'sub_123', status: 'canceled' });

    const result = await cancelSubscription('sub_123');
    expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123');
    expect(result.status).toBe('canceled');
  });
});

describe('getSubscription', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retrieves subscription', async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({ id: 'sub_123', status: 'active' });

    const result = await getSubscription('sub_123');
    expect(result.id).toBe('sub_123');
  });
});

describe('createBillingPortalSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates portal session', async () => {
    mockBillingPortalSessionsCreate.mockResolvedValue({ url: 'https://portal.stripe.com' });

    const result = await createBillingPortalSession('cus_123', 'http://localhost/billing');
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'http://localhost/billing',
    });
    expect(result.url).toBe('https://portal.stripe.com');
  });
});

describe('createCheckoutSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates checkout session', async () => {
    mockCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout' });

    const result = await createCheckoutSession(
      'cus_123',
      'price_pro',
      'http://localhost/success',
      'http://localhost/cancel'
    );
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
        mode: 'subscription',
      })
    );
    expect(result.id).toBe('cs_123');
  });
});

describe('handleStripeWebhook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('handles customer.subscription.created', async () => {
    const event = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          status: 'active',
          items: { data: [{ current_period_end: 1700000000 }] },
        },
      },
    } as any;

    await expect(handleStripeWebhook(event)).resolves.not.toThrow();
  });

  it('handles customer.subscription.deleted', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_123' } },
    } as any;

    await expect(handleStripeWebhook(event)).resolves.not.toThrow();
  });

  it('handles invoice.payment_succeeded', async () => {
    const event = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          parent: {
            subscription_details: { subscription: 'sub_123' },
          },
        },
      },
    } as any;

    await expect(handleStripeWebhook(event)).resolves.not.toThrow();
  });

  it('handles invoice.payment_failed', async () => {
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          parent: {
            subscription_details: { subscription: 'sub_123' },
          },
        },
      },
    } as any;

    await expect(handleStripeWebhook(event)).resolves.not.toThrow();
  });

  it('handles unrecognized event type without error', async () => {
    const event = { type: 'unknown.event', data: { object: {} } } as any;
    await expect(handleStripeWebhook(event)).resolves.not.toThrow();
  });
});
