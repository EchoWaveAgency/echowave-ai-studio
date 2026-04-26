import { NextResponse } from 'next/server';
import { supabaseSelect } from '../../../../lib/supabase';

export async function GET() {
  const data = await supabaseSelect('leads');
  return NextResponse.json(data);
}
