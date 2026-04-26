import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../lib/deepseek';

export async function POST(req) {
  const body = await req.json();
  const report = await askDeepSeek('Return a full business analysis report with 30-day growth plan.', JSON.stringify(body));
  return NextResponse.json({ report });
}
