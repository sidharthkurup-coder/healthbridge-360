'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lang, translations, TranslationKey } from './translations';

const STATUS_TE_MAP: Record<string, string> = {
  SUBMITTED: 'సమర్పించబడింది',
  PENDING: 'పెండింగ్‌లో ఉంది',
  APPROVED: 'ఆమోదించబడింది',
  REJECTED: 'తిరస్కరించబడింది',
  CANCELLED: 'రద్దు చేయబడింది',
  ACKNOWLEDGED: 'గుర్తించబడింది',
  CONTACTED: 'సంప్రదించబడింది',
  DISPATCHED: 'పంపబడింది',
  RESOLVED: 'పరిష్కరించబడింది',
  UNAVAILABLE: 'అందుబాటులో లేదు',
  UNDER_REVIEW: 'పరిశీలనలో ఉంది',
  ASSIGNED: 'కేటాయించబడింది',
  IN_PROGRESS: 'పని జరుగుతోంది',
  REOPENED: 'తిరిగి తెరవబడింది',
  REPORTED: 'నివేదించబడింది',
  WATER_SPRINKLER_DISPATCHED: 'వాటర్ స్ప్రింక్లర్ పంపబడింది',
  ENFORCEMENT_ACTION: 'చట్టపరమైన చర్య',
  GOOD: 'మంచిది',
  SATISFACTORY: 'సంతృప్తికరం',
  MODERATE: 'మితంగా కలుషితం',
  POOR: 'చెడు గాలి',
  VERY_POOR: 'చాలా చెడు గాలి',
  SEVERE: 'ప్రమాదకరం',
  INCOMPLETE: 'అసంపూర్ణం',
  SAFE: 'సురక్షితం',
  UNSAFE: 'అసురక్షితం',
  LOW: 'తక్కువ',
  MEDIUM: 'మధ్యస్థం',
  HIGH: 'అధికం',
  CRITICAL: 'అత్యవసరం',
  AVAILABLE: 'అందుబాటులో ఉంది',
  IN_STOCK: 'నిల్వ ఉంది',
  LOW_STOCK: 'తక్కువ నిల్వ',
  OUT_OF_STOCK: 'నిల్వ లేదు',
  EXPIRED: 'కాలం చెల్లింది',
  VERIFIED: 'ధృవీకరించబడింది',
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  tx: (en: string, te: string) => string;
  ts: (status: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => translations.en[key] ?? key,
  tx: (en) => en,
  ts: (status) => status.replace(/_/g, ' '),
});

const STORAGE_KEY = 'hb360_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === 'en' || saved === 'te') {
        setLangState(saved);
        document.documentElement.lang = saved;
        document.cookie = `${STORAGE_KEY}=${saved}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
        document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // ignore storage access issues
      }
      router.refresh();
    },
    [router]
  );

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'te' : 'en');
  }, [lang, setLang]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] ?? translations.en[key] ?? key;
    },
    [lang]
  );

  const tx = useCallback(
    (en: string, te: string): string => {
      return lang === 'te' ? te : en;
    },
    [lang]
  );

  const ts = useCallback(
    (status: string): string => {
      const key = status?.toUpperCase?.() || '';
      if (lang === 'te' && STATUS_TE_MAP[key]) {
        return STATUS_TE_MAP[key];
      }
      return status.replace(/_/g, ' ');
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, tx, ts }),
    [lang, setLang, toggleLang, t, tx, ts]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
