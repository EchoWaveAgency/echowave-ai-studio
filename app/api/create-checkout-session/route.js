import { NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function POST() {
  if (!env.stripeSecret) {
    return NextResponse.json({ error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY.' }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Stripe SDK integration point ready. Replace this stub with Checkout Session creation.',
    fallbackUrl: `${env.siteUrl}/tools/full-analysis`,
  });
}
