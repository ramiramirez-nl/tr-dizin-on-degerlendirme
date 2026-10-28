import type { FormData } from '../types/form.types';

/** Result per agreement line: true = met, false = not met, null = not applicable. */
export type AgreementResult = boolean | null;

const filled = (value: string | undefined): boolean => Boolean(value && value.trim());

/**
 * Computes agreement lines 1–14 ("Dergi Başvuru Sözleşmesi") from the form values.
 * Line 15 (acceptance of the criteria page) is a checkbox and not computed here.
 */
export function computeAgreement(data: FormData): AgreementResult[] {
  const { website, peerReview, articleFormat, identity, content } = data;
  const method = content?.metadataSubmissionMethod;
  const viaDergipark = method === 'dergipark';
  const viaTrDizin = method === 'trdizin_manual' || method === 'trdizin_xml';

  return [
    filled(website?.aimsAndScopeUrl), // 1
    filled(website?.aimsAndScopeUrl), // 2
    filled(website?.authorGuidelinesUrl), // 3
    filled(peerReview?.peerReviewPolicyUrl) && Boolean(peerReview?.minTwoReviewers), // 4
    Boolean(articleFormat?.abstractAndKeywordsInArticleLanguage), // 5
    Boolean(articleFormat?.abstractAndKeywordsInArticleLanguage), // 6
    Boolean(articleFormat?.affiliationsAndOrcidShown), // 7
    (identity?.publicationLanguages?.length ?? 0) > 0, // 8
    Boolean(articleFormat?.noAdsInsideArticles), // 9
    Boolean(articleFormat?.articleTypeOnTocAndFirstPage), // 10
    Boolean(articleFormat?.datesSubmissionAcceptanceShown), // 11
    filled(articleFormat?.referenceStyle) && Boolean(articleFormat?.referencesLatinScript), // 12
    viaDergipark ? true : viaTrDizin ? null : false, // 13
    viaTrDizin ? true : viaDergipark ? null : false, // 14
  ];
}
