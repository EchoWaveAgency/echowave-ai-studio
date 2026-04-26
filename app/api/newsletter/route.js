import { NextResponse } from 'next/server';
import { supabaseInsert } from '../../../lib/supabase';

export async function POST(req) {
  const body = await req.json();
  await supabaseInsert('newsletter_subscribers', { email: body.email, whatsapp: body.whatsapp || null });
  return NextResponse.json({ ok: true });
}
