import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import tr from './tr.json';

const STORAGE_KEY = 'trdizin-lang';
const supported = ['tr', 'en'];

function readSaved(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && supported.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

const browser = navigator.language.split('-')[0];
const lng = readSaved() ?? (supported.includes(browser) ? browser : 'tr');

i18n.use(initReactI18next).init({
  resources: {
    tr: { t: tr },
    en: { t: en },
  },
  lng,
  fallbackLng: 'en',
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
