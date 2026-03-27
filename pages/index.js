import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { Search, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Home() {
  const [pageUrl, setPageUrl] = useState('');

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#B1935B]/30">
      <Head>
        <title>EchoWave AI Studio | Strategic Marketing Intelligence</title>
        <meta name="description" content="EchoWave Agency AI Studio for Advanced Marketing Analysis" />
      </Head>

      {/* Hero Section / Header */}
      <header className="relative flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-[#B1935B]/10 to-transparent pointer-events-none"></div>
        
        {/* Animated Sound Wave Effect (Optional via CSS) */}
        <div className="absolute top-20 w-full opacity-10 flex justify-center gap-1">
           {[...Array(20)].map((_, i) => (
             <div key={i} className="w-1 bg-[#B1935B] h-12 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
           ))}
        </div>

        {/* Logo Container */}
        <div className="relative w-72 h-72 mb-6 drop-shadow-[0_0_35px_rgba(177,147,91,0.3)]">
          <Image 
            src="/ECHOWAVE MEDIA GROUP LTD Logo Blac.jpg" 
            alt="EchoWave Media Group Logo"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#B1935B] via-[#F3E2B9] to-[#B1935B]">
          AI STUDIO
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-md text-center px-4 font-light tracking-wide uppercase">
          Where Ancient Wisdom Meets Global Intelligence
        </p>
      </header>

      {/* Main Analysis Input Section */}
      <main className="max-w-4xl mx-auto px-6 pb-24 relative z-10">
        <div className="bg-[#0A0A0A] border border-[#B1935B]/20 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#B1935B]/20 to-black border border-[#B1935B]/30">
              <Search className="w-8 h-8 text-[#D6BA7A]" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-[#F3E2B9]">Launch Your AI Strategy</h2>
              <p className="text-gray-500">Enter your Facebook page link for a deep Manus AI analysis.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group">
              <input 
                type="url" 
                placeholder="https://facebook.com/your-business" 
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="w-full p-6 rounded-2xl bg-black border border-[#B1935B]/20 text-lg text-white placeholder:text-gray-700 focus:ring-2 focus:ring-[#B1935B]/50 focus:border-[#F3E2B9] transition-all outline-none"
              />
            </div>
            
            <button className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#B1935B] to-[#8E7548] text-black font-black text-xl uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[#B1935B]/10">
              Analyze With Manus AI
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center">
          <div className="p-6">
            <Zap className="w-8 h-8 text-[#B1935B] mx-auto mb-4" />
            <h3 className="font-bold text-[#F3E2B9]">Instant Scripting</h3>
            <p className="text-gray-500 text-sm mt-2">Generate ad scripts optimized for Egyptian & Global markets.</p>
          </div>
          <div className="p-6">
            <BarChart3 className="w-8 h-8 text-[#B1935B] mx-auto mb-4" />
            <h3 className="font-bold text-[#F3E2B9]">Market Insights</h3>
            <p className="text-gray-500 text-sm mt-2">Manus AI analyzes competitors and trends in seconds.</p>
          </div>
          <div className="p-6">
            <ShieldCheck className="w-8 h-8 text-[#B1935B] mx-auto mb-4" />
            <h3 className="font-bold text-[#F3E2B9]">Agency Quality</h3>
            <p className="text-gray-500 text-sm mt-2">Built by EchoWave's strategic risk & marketing experts.</p>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="py-10 text-center border-t border-white/5">
        <p className="text-gray-600 text-sm tracking-widest">© 2026 ECHOWAVE MEDIA GROUP LTD. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
