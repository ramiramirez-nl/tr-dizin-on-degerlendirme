/**
 * Maps report sections to the official TR Dizin criteria page that explains
 * the underlying requirement. Section-level (not per-field) so links stay
 * stable when TR Dizin reorganises page anchors. Turkish is the default;
 * English readers get the English mirror pages.
 */
const TR_CRITERIA_URL = 'https://trdizin.gov.tr/kriterler/';

const EN_REQUIREMENTS_URL =
  'https://trdizin.gov.tr/en/tr-index-application-requirements-and-journal-evaluation-criteria-2/';
const EN_CRITERIA_URL = 'https://trdizin.gov.tr/en/tr-index-journal-evaluation-criteria/';

const EN_SECTION_URLS: Record<string, string> = {
  Identity: EN_REQUIREMENTS_URL,
  Website: EN_REQUIREMENTS_URL,
  'Article Format': EN_REQUIREMENTS_URL,
  'Editorial Boards': EN_CRITERIA_URL,
  'Peer Review': EN_CRITERIA_URL,
  Ethics: EN_CRITERIA_URL,
  Content: EN_CRITERIA_URL,
};

const KNOWN_SECTIONS = Object.keys(EN_SECTION_URLS);

export function criteriaUrlFor(section: string, language?: string): string | undefined {
  if (!KNOWN_SECTIONS.includes(section)) return undefined;
  return language === 'en' ? EN_SECTION_URLS[section] : TR_CRITERIA_URL;
}
