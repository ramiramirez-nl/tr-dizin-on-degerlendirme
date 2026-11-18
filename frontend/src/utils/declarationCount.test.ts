import { describe, it, expect } from 'vitest';
import { declarationCount, hiddenDeclarations } from './declarationCount';
import type { FormData } from '../types/form.types';

describe('review declaration counts', () => {
  it('leaves out yes/no questions and fields the step does not show', () => {
    const data = {
      identity: { subjectArea: 'social_humanities' },
      website: { journalInfoComplete: true, indexingClaimsAccurate: true, abbreviationShown: true, nameChanged: false, hasJournalHistory: false },
      content: { publishesOnTime: true, articleCountsBalanced: true, authorInstitutionDiversity: true, onlyReviewOrCaseReportStated: false, specialIssuesSeparatePaging: true, specialIssuesLastYear: 1 },
    } as unknown as Partial<FormData>;
    const hidden = hiddenDeclarations(data);
    expect(declarationCount(data.website, hidden.website)).toBe('3 / 3');
    expect(declarationCount(data.content, hidden.content)).toBe('4 / 4');
  });

  it('counts the journal history once a name change is declared', () => {
    const data = { website: { journalInfoComplete: true, nameChanged: true, hasJournalHistory: false } } as unknown as Partial<FormData>;
    expect(declarationCount(data.website, hiddenDeclarations(data).website)).toBe('1 / 2');
  });
});
