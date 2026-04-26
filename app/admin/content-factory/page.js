'use client';
import { useState } from 'react';
export default function ContentFactoryPage() {
  const [result, setResult] = useState('');
  async function run(formData) {
    const res = await fetch('/api/admin/content', { method: 'POST', body: JSON.stringify(Object.fromEntries(formData.entries())) });
    setResult((await res.json()).result || '');
  }
  return <main className="p-6"><h1 className="text-gold">Content Factory</h1><form onSubmit={async (e) => { e.preventDefault(); await run(new FormData(e.currentTarget)); }}><input className="w-full bg-zinc-900 p-2" name="topic" placeholder="الموضوع"/><button className="bg-gold px-3 py-1 text-black">أنتج المحتوى</button></form><pre>{result}</pre></main>;
}
