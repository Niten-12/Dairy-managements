import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon    from './locales/en/common.json'
import enAuth      from './locales/en/auth.json'
import enNav       from './locales/en/nav.json'
import enDashboard from './locales/en/dashboard.json'

import teCommon    from './locales/te/common.json'
import teAuth      from './locales/te/auth.json'
import teNav       from './locales/te/nav.json'
import teDashboard from './locales/te/dashboard.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, nav: enNav, dashboard: enDashboard },
      te: { common: teCommon, auth: teAuth, nav: teNav, dashboard: teDashboard },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'te'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'nav', 'dashboard'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dairypro_language',
    },
    react: { useSuspense: true },
  })

export default i18n
