import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { 
  Monitor, 
  Video, 
  Music, 
  Cpu, 
  Megaphone, 
  Palette, 
  Printer, 
  Calendar, 
  Layers, 
  Search, 
  ArrowUpRight 
} from 'lucide-react';

export default function Home() {
  const [pageUrl, setPageUrl] = useState('');

  const services = [
    {
      category: "Creative & Branding",
      icon: <Palette className="w-8 h-8 text-[#B1935B]" />,
      items: ["البراندنج وتطوير الهوية", "التصميمات الجرافيكية", "الأنيميشن والموشن جرافيك", "الطباعة بجميع أنواعها"]
    },
    {
      category: "Digital & Dev",
      icon: <Monitor className="w-8 h-8 text-[#B1935B]" />,
      items: ["بناء المواقع والتطبيقات", "إدارة وتحديث الأنظمة", "حلول الأتمتة (Automation)", "إدارة المنصات الرقمية"]
    },
    {
      category: "Media Production",
      icon: <Video className="w-8 h-8 text-[#B1935B]" />,
      items: ["إعلانات التلفزيون والراديو", "تصوير وإنتاج الفيديو", "إنتاج الأغاني (صوت وصورة)", "التصوير الفوتوغرافي"]
    },
    {
      category: "Growth & Events",
      icon: <Megaphone className="w-8 h-8 text-[#B1935B]" />,
      items: ["التسويق الإلكتروني الشامل", "تنظيم الفعاليات (Events)", "حلول الذكاء الاصطناعي", "بناء أدوات تسهيل الأعمال"]
    }
  ];

  return (
    <>
      <Head>
        <title>EchoWave Media Group | Full-Service Innovation Hub</title>
      </Head>

      <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-[#B1935B]/30">
        
        {/* Navigation */}
        <nav className="fixed w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md px-6 md:px-16 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 relative transition-transform duration-500 group-hover:scale-110">
              <Image src="/ECHOWAVE MEDIA GROUP LTD Logo.png" layout="fill" objectFit="contain" alt="Logo" />
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-[0.3em] text-sm text-[#E6D1A2]">ECHOWAVE</span>
              <span className="text-[8px] tracking-[0.4em] text-gray-500 uppercase">Media Group</span>
            </div>
          </div>
          <div className="hidden lg:flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <a href="#services" className="hover:text-[#B1935B] transition-all">Services</a>
            <a href="#ai-hub" className="text-[#E6D1A2] hover:brightness-125 transition-all">AI Tools Hub</a>
            <a href="#contact" className="hover:text-white transition-all">Contact</a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-56 pb-32 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#B1935B]/10 rounded-full blur-[120px] -z-10"></div>
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] uppercase">
              The Power <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#E6D1A2] via-[#B1935B] to-[#8A6D3B]">of EchoWave</span>
            </h1>
            <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-2xl font-light leading-relaxed mb-12">
              من البراندنج والإنتاج السينمائي إلى بناء أدوات الذكاء الاصطناعي.. <br className="hidden md:block"/> 
              نحن نبني المستقبل الرقمي لأعمالك بلمسة عالمية.
            </p>
          </div>
        </section>

        {/* Comprehensive Services Grid */}
        <section id="services" className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl font-bold tracking-widest text-[#B1935B] uppercase mb-4">Our Expertise</h2>
            <div className="h-1 w-20 bg-[#B1935B]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <div key={index} className="group p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-[#B1935B]/30 transition-all">
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-4 bg-black border border-[#B1935B]/20 rounded-2xl group-hover:bg-[#B1935B] group-hover:text-black transition-all">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{service.category}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {service.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-400 group-hover:text-gray-200 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#B1935B]/40"></div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI HUB Section - الأداة الحالية ومكان للأدوات القادمة */}
        <section id="ai-hub" className="py-32 px-6 md:px-16 bg-[#050505]">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#111] to-black border border-[#B1935B]/20 rounded-[4rem] p-8 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Cpu className="w-40 h-40 text-[#B1935B]" />
            </div>
            
            <div className="relative z-10">
              <span className="inline-block px-5 py-2 rounded-full bg-[#B1935B]/10 border border-[#B1935B]/30 text-[#E6D1A2] text-[10px] font-bold uppercase tracking-widest mb-8">
                Proprietary AI Ecosystem
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase">AI Tools Hub</h2>
              <p className="text-gray-500 max-w-2xl mb-12 text-lg">
                بناء أدوات ذكاء اصطناعي مخصصة لتسهيل الأعمال في كافة المجالات. ابدأ باستخدام أداة تحليل الجمهور المتطورة لدينا.
              </p>

              {/* Manus AI Tool Interface */}
              <div className="bg-black/50 backdrop-blur-md border border-white/5 p-8 rounded-3xl max-w-3xl">
                <div className="flex items-center gap-4 mb-6">
                  <Search className="w-6 h-6 text-[#B1935B]" />
                  <span className="font-bold text-sm tracking-widest uppercase">Manus AI v1.0</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="url" 
                    placeholder="Enter URL for analysis..." 
                    className="flex-grow bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-[#B1935B] text-white transition-all"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                  />
                  <button className="bg-[#B1935B] text-black font-black px-10 py-5 rounded-2xl hover:bg-[#E6D1A2] transition-all flex items-center justify-center gap-3">
                    ANALYZE <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-4 italic tracking-widest">More tools for Automation, Scripting, and Risk Analysis coming soon.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer id="contact" className="py-24 border-t border-white/5 text-center">
          <div className="flex flex-col items-center gap-10">
            <div className="w-20 h-20 relative grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <Image src="/ECHOWAVE MEDIA GROUP LTD Logo.png" layout="fill" objectFit="contain" alt="Footer Logo" />
            </div>
            <div className="space-y-4">
              <h4 className="text-[#B1935B] font-bold tracking-[0.3em] text-xs uppercase">EchoWave Media Group LTD</h4>
              <p className="text-gray-600 text-[10px] tracking-[0.5em] uppercase">Southampton • Cairo</p>
            </div>
            <p className="text-[9px] text-gray-800 tracking-[0.4em] max-w-xs leading-relaxed uppercase">
              Strategic Branding • AI Solutions • Professional Production • Business Automation
            </p>
            <div className="h-px w-20 bg-white/5"></div>
            <p className="text-[8px] text-gray-900 tracking-widest italic">© 2026 ECHOWAVE MEDIA GROUP. ALL RIGHTS RESERVED.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
