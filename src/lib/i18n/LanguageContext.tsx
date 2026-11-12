'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Lang, translations, TranslationKey } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => translations.en[key] ?? key,
});

const STORAGE_KEY = 'hb360_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === 'en' || saved === 'te') {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // ignore storage access issues
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'te' : 'en');
  }, [lang, setLang]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] ?? translations.en[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
