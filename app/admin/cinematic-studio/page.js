'use client';
import { useState } from 'react';
export default function CinematicStudioPage() {
  const [result, setResult] = useState('');
  async function run(formData) {
    const res = await fetch('/api/admin/cinematic', { method: 'POST', body: JSON.stringify(Object.fromEntries(formData.entries())) });
    setResult((await res.json()).result || '');
  }
  return <main className="p-6"><h1 className="text-gold">Cinematic Studio</h1><form onSubmit={async (e) => { e.preventDefault(); await run(new FormData(e.currentTarget)); }} className="space-y-2"><input className="w-full bg-zinc-900 p-2" name="idea" placeholder="الفكرة"/><button className="bg-gold px-3 py-1 text-black">أنتج السيناريو</button></form><pre>{result}</pre></main>;
}
