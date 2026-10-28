import type { FormData, ValidationContext } from '../types/formData';
import type { ReportItem, ReportResponse } from '../types/report';
import { validateIdentity } from './identity';
import { validateWebsite } from './website';
import { validateEditorialBoards } from './editorialBoards';
import { validatePeerReview } from './peerReview';
import { validateArticleFormat } from './articleFormat';
import { validateEthics } from './ethics';
import { validateContent } from './content';
import { criteriaUrlFor } from './criteriaLinks';
import { pick } from './shared';

export const SECTION_NAMES = [
  'Identity',
  'Website',
  'Editorial Boards',
  'Peer Review',
  'Article Format',
  'Ethics',
  'Content',
];

export interface SectionResult {
  section: string;
  index: number;
  items: ReportItem[];
}

export async function runAllValidations(
  formData: FormData,
  language?: string,
  onSection?: (result: SectionResult) => void
): Promise<ReportResponse> {
  const context: ValidationContext = {
    subjectArea: formData.identity.subjectArea,
    issuesPerYear: formData.identity.issuesPerYear,
  };
  const validators: Array<Promise<ReportItem[]>> = [
    validateIdentity(formData.identity, language, context),
    validateWebsite(formData.website, language, context),
    validateEditorialBoards(formData.editorialBoards, language, context),
    validatePeerReview(formData.peerReview, language, context),
    validateArticleFormat(formData.articleFormat, language, context),
    validateEthics(formData.ethics, language, context),
    validateContent(formData.content, language, context),
  ];

  // Each validator is wrapped so its result is decorated and emitted the
  // moment it settles (live progress via SSE); a crash degrades to a single
  // warning item instead of failing the whole assessment.
  const wrapped = validators.map((promise, i) =>
    promise
      .then(
        (items) => items,
        (reason): ReportItem[] => {
          const message =
            reason instanceof Error ? reason.message : String(reason);
          console.error(`[validator] ${SECTION_NAMES[i]} crashed:`, message);
          return [
            {
              section: SECTION_NAMES[i],
              field: 'validation',
              status: 'warning',
              message: pick(language, {
                tr: 'Bu bölümün doğrulaması beklenmeyen bir hata nedeniyle tamamlanamadı.',
                en: 'Validation for this section could not complete due to an unexpected error.',
              }),
              suggestion: pick(language, {
                tr: 'Lütfen bu bölümdeki bilgileri kontrol edip yeniden deneyin.',
                en: 'Please check the information in this section and try again.',
              }),
            },
          ];
        }
      )
      .then((items) => {
        // Attach the relevant TR Dizin criteria link in one place so individual
        // validators stay focused on their own logic.
        const decorated = items.map((item) => ({
          ...item,
          criteriaUrl: item.criteriaUrl ?? criteriaUrlFor(item.section, language),
        }));
        onSection?.({ section: SECTION_NAMES[i], index: i, items: decorated });
        return decorated;
      })
  );

  const allResults: ReportItem[] = (await Promise.all(wrapped)).flat();

  const failCount = allResults.filter((r) => r.status === 'fail').length;
  const warningCount = allResults.filter((r) => r.status === 'warning').length;
  const passCount = allResults.filter((r) => r.status === 'pass').length;
  const issues = allResults.filter((r) => r.status !== 'pass');

  const overallStatus =
    failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass';

  return {
    overallStatus,
    passCount,
    failCount,
    warningCount,
    items: allResults,
    issues,
  };
}
