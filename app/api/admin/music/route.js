import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../../lib/deepseek';

export async function POST(req) {
  const body = await req.json();
  const result = await askDeepSeek('Write Egyptian dialect lyrics: 4 verses + chorus.', JSON.stringify(body));
  return NextResponse.json({ result });
}
