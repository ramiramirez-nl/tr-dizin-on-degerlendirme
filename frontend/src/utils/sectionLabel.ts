// Maps the section names sent by the backend to the already-translated step
// navigation labels, so no new translation keys are needed per section.
export const SECTION_TO_STEP_KEY: Record<string, string> = {
  Identity: 'steps.identity',
  Website: 'steps.website',
  'Editorial Boards': 'steps.editorialBoards',
  'Peer Review': 'steps.peerReview',
  'Article Format': 'steps.articleFormat',
  Ethics: 'steps.ethics',
  Content: 'steps.content',
};

/** Translated section name, or the backend name when it is unknown. */
export function sectionLabel(section: string, t: (key: string) => string): string {
  const key = SECTION_TO_STEP_KEY[section];
  return key ? t(key) : section;
}
