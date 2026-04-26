import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../../lib/deepseek';

export async function POST(req) {
  const body = await req.json();
  const result = await askDeepSeek('Create marketing content aligned to requested platform/type.', JSON.stringify(body));
  return NextResponse.json({ result });
}
