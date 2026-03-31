'use client';

import { useMemo, useState } from 'react';

import { translations, type Language } from '@/lib/translations';

/**
 * Client-side translation hook that detects browser language
 * Used for auth pages where user is not logged in
 */
export function useBrowserTranslation() {
  const [browserLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en-US';
    const nav = navigator as Navigator & { userLanguage?: string | undefined };
    const detectedLang = nav.language || nav.userLanguage || 'en-US';
    if (detectedLang.startsWith('pt')) return 'pt-BR';
    return 'en-US';
  });

  const t = useMemo(() => {
    const translationsData = translations[browserLanguage];
    
    return (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let value: unknown = translationsData;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return path; // Return the path if translation not found
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

