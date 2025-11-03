import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { translations, type Language } from '@/lib/translations';

interface UserPreferences {
  language?: Language;
}

interface SessionUser {
  preferences?: UserPreferences;
}

/**
 * Server-side translation function for Server Components
 * Reads user's language preference from session
 */
export async function getServerTranslation() {
  const session = await getServerSession(authOptions);
  
  // Get user's language preference from session or default to en-US
  let language: Language = 'en-US';
  
  if (session?.user && 'preferences' in session.user) {
    const prefs = (session.user as SessionUser).preferences;
    if (prefs?.language === 'pt-BR' || prefs?.language === 'en-US') {
      language = prefs.language;
    }
  }

  const translations_data = translations[language];
  
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations_data;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
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

  return { t, language };
}

