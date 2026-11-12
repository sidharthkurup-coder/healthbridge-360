'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Shield, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const Footer = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 perf-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Platform identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-base">
                HB
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">HEALTHBRIDGE 360</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t('footer.desc')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs text-teal-300">
                <Shield className="w-3.5 h-3.5" />
                <span>{t('topbar.event')}</span>
              </div>
              <div className="inline-flex bg-navy-900 border border-navy-800 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    lang === 'en' ? 'bg-teal-500 text-navy-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('te')}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    lang === 'te' ? 'bg-teal-500 text-navy-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  తెలుగు
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Six Modules */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t('footer.modulesTitle')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/healthcare" className="hover:text-teal-300 transition-colors">
                  1. {t('mod1.title')}
                </Link>
              </li>
              <li>
                <Link href="/medicines" className="hover:text-teal-300 transition-colors">
                  2. {t('mod2.title')}
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-teal-300 transition-colors">
                  3. {t('mod3.title')}
                </Link>
              </li>
              <li>
                <Link href="/water" className="hover:text-teal-300 transition-colors">
                  4. {t('mod4.title')}
                </Link>
              </li>
              <li>
                <Link href="/sanitation" className="hover:text-teal-300 transition-colors">
                  5. {t('mod5.title')}
                </Link>
              </li>
              <li>
                <Link href="/intelligence" className="hover:text-teal-300 transition-colors">
                  6. {t('mod6.title')}
                </Link>
              </li>
              <li>
                <Link href="/air-quality" className="hover:text-teal-300 transition-colors">
                  7. {t('nav.airQuality')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency & Location */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t('footer.dirTitle')}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{t('footer.address')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('footer.phc')}</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t('footer.ambulance')}</span>
              </div>
            </div>
          </div>

          {/* Col 4: Safety & Medical Disclaimer */}
          <div className="bg-navy-900/60 p-4 rounded-xl border border-navy-800 text-xs space-y-2">
            <h5 className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-400" />
              {t('footer.safetyTitle')}
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t('footer.safetyDesc')}</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-navy-800">
              {t('hero.teamLabel')} <strong className="text-slate-300">Ctrl Alt Defeat</strong>
            </p>
          </div>
        </div>

        <div className="border-t border-navy-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-teal-400 transition-colors">
              {t('nav.dashboard')}
            </Link>
            <Link href="/admin" className="hover:text-teal-400 transition-colors">
              {t('nav.admin')}
            </Link>
            <Link href="/login" className="hover:text-teal-400 transition-colors">
              {t('nav.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
