import '../styles/globals.css';

export const metadata = {
  title: 'EchoWave Agency Ltd',
  description: 'Where Ancient Vision Meets Modern Creativity',
  openGraph: {
    title: 'EchoWave Agency Ltd',
    description: 'Hybrid Agency + AI SaaS + Client Portal',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
