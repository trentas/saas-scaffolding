import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { stripe, handleStripeWebhook } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the webhook event
    await handleStripeWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Stripe webhook error:', error);
    
    if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeSignatureVerificationError') {
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Webhook error' },
      { status: 500 }
    );
  }
}
