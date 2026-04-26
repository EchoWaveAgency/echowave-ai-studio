import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../lib/deepseek';

export async function POST(req) {
  const body = await req.json();
  const result = await askDeepSeek('You are Horus, executive growth AI assistant for EchoWave Agency.', body.message || '');
  return NextResponse.json({ reply: result });
}
