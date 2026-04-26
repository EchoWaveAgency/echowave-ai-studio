import { NextResponse } from 'next/server';
import { supabaseInsert } from '../../../../lib/supabase';

export async function POST(req) {
  const payload = await req.json().catch(() => ({}));
  await supabaseInsert('payments', {
    email: payload?.data?.object?.customer_details?.email || null,
    amount: payload?.data?.object?.amount_total ? payload.data.object.amount_total / 100 : null,
    transaction_id: payload?.data?.object?.id || 'unknown',
    payment_method: 'stripe',
    status: 'paid',
    metadata: payload,
  });

  return NextResponse.json({ received: true, note: 'Webhook stub active. Add Stripe signature validation in production.' });
}
