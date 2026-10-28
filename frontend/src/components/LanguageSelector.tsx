import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'tr', label: '🇹🇷 TR' },
  { code: 'en', label: '🇬🇧 EN' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:border-gray-400 focus:outline-none"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
