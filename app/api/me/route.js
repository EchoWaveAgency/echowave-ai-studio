import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Wire this route to Supabase auth session for current user profile.' });
}
