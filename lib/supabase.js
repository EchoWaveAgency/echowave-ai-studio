import { env } from './env';

export async function supabaseInsert(table, payload) {
  if (!env.supabaseUrl || !env.supabaseServiceRole) return null;
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseServiceRole,
      Authorization: `Bearer ${env.supabaseServiceRole}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function supabaseSelect(table) {
  if (!env.supabaseUrl || !env.supabaseServiceRole) return [];
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: env.supabaseServiceRole,
      Authorization: `Bearer ${env.supabaseServiceRole}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function supabaseUpdate(table, id, payload) {
  if (!env.supabaseUrl || !env.supabaseServiceRole) return;
  await fetch(`${env.supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: env.supabaseServiceRole,
      Authorization: `Bearer ${env.supabaseServiceRole}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
