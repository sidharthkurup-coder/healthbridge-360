import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Noto_Sans_Telugu } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RouteProgressBar } from '@/components/ui/Motion';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-telugu',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HEALTHBRIDGE 360 — Integrated Community Healthcare & Essential Services',
  description:
    'Unified public health, medicine inventory, emergency response, 5-section water distribution, and explainable sanitation management platform for Kantheru, Andhra Pradesh, India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${notoTelugu.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
        <LanguageProvider>
          <RouteProgressBar />
          <Navbar />
          <main className="flex-1 relative">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
