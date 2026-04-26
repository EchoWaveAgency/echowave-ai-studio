'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-lg text-gold">EchoWave Agency Ltd</Link>
        <div className="flex gap-3 text-sm">
          <Link href="/dashboard" className="hover:text-gold">لوحة العميل</Link>
          <Link href="/admin/dashboard" className="hover:text-gold">لوحة المسؤول</Link>
          <button onClick={() => setOpen(!open)} className="rounded border border-gold px-3 py-1 text-gold">تسجيل الدخول / حسابي</button>
        </div>
      </nav>
      {open && <div className="mx-auto mb-4 max-w-md glass rounded-xl p-4 text-sm">مصادقة Supabase قابلة للربط هنا (Email/Password + Google OAuth).</div>}
    </header>
  );
}
