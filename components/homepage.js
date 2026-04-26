'use client';

import { useState } from 'react';

const services = ['Brand Strategy','Cinematic Content Production','Social Media Management','Paid Ads Systems','Website Development','AI Automation','WhatsApp Sales Automation','Analytics & Growth Reports','Real Estate Marketing','Medical Marketing','Restaurant Growth Systems','Industrial Branding'];

const offers = ['Startup Web Development','Medical Social Media','Real Estate AI Funnel','Industrial Branding','Restaurant Sales System','Full Business Analysis'];

export function Homepage() {
  const [socialLinks, setSocialLinks] = useState({});
  const [analysis, setAnalysis] = useState('');

  async function submitQuickAnalysis(formData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/quick-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, socialLinks }),
    });
    const data = await res.json();
    setAnalysis(JSON.stringify(data, null, 2));
  }

  return (
    <main>
      <section className="relative min-h-[80vh] px-6 py-24 text-center">
        <video className="absolute inset-0 h-full w-full object-cover opacity-30" autoPlay muted loop playsInline src="/videos/hero.mp4" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="font-heading text-4xl text-gold md:text-6xl">Where Ancient Vision Meets Modern Creativity</h1>
          <p className="mt-6 text-lg">EchoWave builds cinematic growth systems powered by strategy, data, automation and AI.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#quick-analysis" className="rounded bg-gold px-4 py-2 text-black">ابدأ التحليل المجاني</a>
            <a href="/payment" className="rounded border border-gold px-4 py-2 text-gold">احصل على التحليل الشامل</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-4 text-2xl font-heading text-gold">خدماتنا</h2>
        <div className="grid gap-4 md:grid-cols-3">{services.map((s) => <article key={s} className="glass rounded-xl p-4">{s}</article>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-4 text-2xl font-heading text-gold">عروض حصرية</h2>
        <div className="grid gap-4 md:grid-cols-3">{offers.map((s) => <article key={s} className="glass rounded-xl p-4">{s}</article>)}</div>
      </section>

      <section id="quick-analysis" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-4 text-2xl font-heading text-gold">نموذج التحليل المجاني</h2>
        <form onSubmit={async (e) => { e.preventDefault(); await submitQuickAnalysis(new FormData(e.currentTarget)); }} className="space-y-3 glass rounded-2xl p-6">
          <input name="fullName" placeholder="الاسم الكامل" className="w-full rounded bg-black/60 p-2" required />
          <input name="phone" placeholder="رقم الهاتف/واتساب" className="w-full rounded bg-black/60 p-2" required />
          <input name="businessName" placeholder="اسم النشاط" className="w-full rounded bg-black/60 p-2" required />
          <textarea name="challenge" placeholder="أكبر تحدي" className="w-full rounded bg-black/60 p-2" required />
          <textarea name="goal" placeholder="هدف 3 أشهر" className="w-full rounded bg-black/60 p-2" required />
          {['TikTok','Instagram','Facebook','YouTube','LinkedIn','WhatsApp','Telegram'].map((platform) => (
            <input key={platform} placeholder={`${platform} link`} className="w-full rounded bg-black/60 p-2" onChange={(e) => setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))} />
          ))}
          <input name="website" placeholder="الموقع (اختياري)" className="w-full rounded bg-black/60 p-2" />
          <button className="rounded bg-gold px-4 py-2 text-black">إرسال التحليل</button>
        </form>
        {analysis && <pre className="mt-4 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs">{analysis}</pre>}
      </section>
    </main>
  );
}
