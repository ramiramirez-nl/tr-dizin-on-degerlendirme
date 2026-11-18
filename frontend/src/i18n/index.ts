import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import tr from './tr.json';
import { SUPPORTED_LANGUAGES, initialLanguage } from './language';

const STORAGE_KEY = 'trdizin-lang';

function readSaved(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

const lng = initialLanguage(readSaved());

i18n.use(initReactI18next).init({
  resources: {
    tr: { t: tr },
    en: { t: en },
  },
  lng,
  fallbackLng: 'tr',
  defaultNS: 't',
  interpolation: { escapeValue: false },
});

// Keep <html lang> in sync with the UI language (index.html ships lang="tr").
document.documentElement.lang = lng;

i18n.on('languageChanged', (l) => {
  document.documentElement.lang = l;
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // storage unavailable — language preference is best-effort
  }
});

// Both supported languages are left-to-right.
document.documentElement.dir = 'ltr';

export default i18n;
