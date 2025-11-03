'use client';

import { useMemo, useEffect, useState } from 'react';
import { translations, type Language } from '@/lib/translations';

/**
 * Client-side translation hook that detects browser language
 * Used for auth pages where user is not logged in
 */
export function useBrowserTranslation() {
  const [browserLanguage, setBrowserLanguage] = useState<Language>('en-US');

  useEffect(() => {
    // Detect browser language on client-side only
    if (typeof window !== 'undefined') {
      const detectedLang = navigator.language || (navigator as any).userLanguage || 'en-US';
      
      // Map browser language to our supported languages
      let lang: Language = 'en-US';
      if (detectedLang.startsWith('pt')) {
        lang = 'pt-BR';
      } else if (detectedLang.startsWith('en')) {
        lang = 'en-US';
      }
      
      setBrowserLanguage(lang);
    }
  }, []);

  const t = useMemo(() => {
    const translations_data = translations[browserLanguage];
    
    return (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = translations_data;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return path;
        }
      }
      
      if (typeof value !== 'string') {
        return path;
      }

      // Replace placeholders with params
      if (params) {
        let result = value;
        for (const [key, val] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
        }
        return result;
      }
      
      return value;
    };
  }, [browserLanguage]);

  return { t, language: browserLanguage };
}

