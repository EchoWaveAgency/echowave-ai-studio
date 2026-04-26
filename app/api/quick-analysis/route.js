import { NextResponse } from 'next/server';
import { askDeepSeek } from '../../../lib/deepseek';
import { supabaseInsert } from '../../../lib/supabase';

export async function POST(req) {
  const payload = await req.json();
  let result = {
    strengths: ['وضوح الهدف', 'قابلية للنمو', 'مرونة في السوق'],
    weaknesses: ['غياب نظام محتوى واضح', 'ضعف تتبع البيانات', 'محدودية قنوات البيع'],
    quickWins: ['تقويم محتوى أسبوعي', 'Landing page واضحة', 'واتساب funnel'],
    recommendation: 'Upgrade to full analysis for tailored 30-day growth plan.',
  };

  try {
    const ai = await askDeepSeek(
      'You are a marketing strategist. Return strict JSON with strengths, weaknesses, quickWins, recommendation.',
      JSON.stringify(payload),
    );
    result = JSON.parse(ai);
  } catch {}

  const leadRows = await supabaseInsert('leads', {
    full_name: payload.fullName,
    phone: payload.phone,
    business_name: payload.businessName,
    challenge: payload.challenge,
    goal: payload.goal,
    website: payload.website || null,
    social_links: payload.socialLinks || {},
  });

  const leadId = leadRows?.[0]?.id;
  if (leadId) {
    await supabaseInsert('quick_analyses', {
      lead_id: leadId,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      quick_wins: result.quickWins,
      recommendation: result.recommendation,
    });
  }

  return NextResponse.json(result);
}
