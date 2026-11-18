export const SUPPORTED_LANGUAGES = ['tr', 'en'];

/**
 * Turkish unless the user picked English earlier with the language selector.
 * The browser language is ignored on purpose: TR Dizin is a Turkish index,
 * and the report language follows the UI language.
 */
export function initialLanguage(saved: string | null): string {
  return saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : 'tr';
}
