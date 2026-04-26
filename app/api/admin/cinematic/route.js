import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../../lib/deepseek';

export async function POST(req) {
  const body = await req.json();
  const result = await askDeepSeek('Create cinematic ad script split by seconds with VO and dialogue.', JSON.stringify(body));
  return NextResponse.json({ result });
}
