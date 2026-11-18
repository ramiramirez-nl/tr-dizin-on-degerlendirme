import type { FormData } from '../types/form.types';

/**
 * Counts the checked boolean declarations of a section. `skip` leaves out
 * yes/no questions that are not declarations and fields hidden on the step.
 */
export function declarationCount(section: object | undefined, skip: string[] = []): string {
  const values = Object.entries(section ?? {})
    .filter(([key, v]) => typeof v === 'boolean' && !skip.includes(key))
    .map(([, v]) => v as boolean);
  return `${values.filter(Boolean).length} / ${values.length}`;
}

/** Fields left out of the count per section, mirroring what each step shows. */
export function hiddenDeclarations(data: Partial<FormData>): Record<string, string[]> {
  const subjectArea = data.identity?.subjectArea;
  const singleType = subjectArea === 'review_only' || subjectArea === 'case_report_only';
  return {
    website: ['nameChanged', ...(data.website?.nameChanged ? [] : ['hasJournalHistory'])],
    articleFormat: ['publishesNonLatinScript', ...(data.articleFormat?.publishesNonLatinScript ? [] : ['latinScriptForNonLatin'])],
    content: [
      ...(singleType ? [] : ['onlyReviewOrCaseReportStated']),
      ...((Number(data.content?.specialIssuesLastYear) || 0) > 0 ? [] : ['specialIssuesSeparatePaging']),
    ],
  };
}
