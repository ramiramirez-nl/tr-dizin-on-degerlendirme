import type { FormData } from '../types/form.types';

const DRAFT_KEY = 'trdizin-on-degerlendirme-draft-v1';

export function loadDraft(defaults: FormData): FormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormData>;
    if (!parsed || typeof parsed !== 'object' || !parsed.identity) return null;
    return {
      identity: { ...defaults.identity, ...parsed.identity },
      website: { ...defaults.website, ...parsed.website },
      editorialBoards: { ...defaults.editorialBoards, ...parsed.editorialBoards },
      peerReview: { ...defaults.peerReview, ...parsed.peerReview },
      articleFormat: { ...defaults.articleFormat, ...parsed.articleFormat },
      ethics: { ...defaults.ethics, ...parsed.ethics },
      content: { ...defaults.content, ...parsed.content },
      agreement: { ...defaults.agreement, ...parsed.agreement },
    };
  } catch {
    return null;
  }
}

export function saveDraft(values: unknown): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // localStorage full or unavailable — drafts are best-effort
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
