import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ar from './locales/ar.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'
import tl from './locales/tl.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',    nativeLabel: 'English',    dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', label: 'Arabic',     nativeLabel: 'العربية',    dir: 'rtl', flag: '🇦🇪' },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिन्दी',       dir: 'ltr', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu',       nativeLabel: 'اردو',        dir: 'rtl', flag: '🇵🇰' },
  { code: 'tl', label: 'Tagalog',    nativeLabel: 'Filipino',   dir: 'ltr', flag: '🇵🇭' },
]

export const RTL_LANGUAGES = ['ar', 'ur']

export function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      hi: { translation: hi },
      ur: { translation: ur },
      tl: { translation: tl },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'hi', 'ur', 'tl'],
    // Normalize detected language: 'en-GB' → 'en', 'ar-AE' → 'ar'
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'rlco-lang',
      convertDetectedLanguage: (lng) => lng.split('-')[0],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
