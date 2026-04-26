import { env } from './env';

export async function askDeepSeek(system, prompt) {
  if (!env.deepseekApiKey) throw new Error('DEEPSEEK_API_KEY is missing');
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek failed with ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
