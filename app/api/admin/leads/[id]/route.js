import { NextResponse } from 'next/server';
import { supabaseUpdate } from '../../../../../lib/supabase';

export async function PATCH(req, { params }) {
  const body = await req.json();
  await supabaseUpdate('leads', params.id, { status: body.status });
  return NextResponse.json({ ok: true });
}
