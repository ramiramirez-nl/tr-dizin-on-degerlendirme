/**
 * Form data shape for the TR Dizin pre-assessment.
 *
 * Section names mirror the eight steps of the frontend form. Each section maps
 * to one validator in ../validators. Criterion references in comments point to
 * the official TR Dizin pages:
 *   ÖK  = "TR Dizin Dergi Başvurusu İçin Ön Koşullar" (prerequisites 1–14)
 *   K   = "TR Dizin Dergi Değerlendirme Kriterleri" (evaluation criteria 1–18)
 *   GH  = "TR Dizin İçin Dikkat Edilmesi Gereken Genel Hususlar" (general points 1–14)
 *   T   = "Tavsiyeler" (recommendations 1–5)
 * Source: https://trdizin.gov.tr/kriterler/
 */

export type SubjectArea =
  | 'health' // Sağlık Bilimleri, Diş Hekimliği, Eczacılık
  | 'engineering_science_vet' // Mühendislik, Temel Bilimler, Veterinerlik
  | 'social_humanities' // Sosyal ve Beşeri Bilimler
  | 'review_only' // Derleme dergisi
  | 'case_report_only'; // Olgu sunumu dergisi

export type MetadataSubmissionMethod = 'dergipark' | 'trdizin_manual' | 'trdizin_xml';

export interface IdentityData {
  journalTitle: string;
  homepageUrl: string;
  issnPrint: string;
  issnOnline: string;
  subjectArea: SubjectArea | '';
  issuesPerYear: number; // ÖK2
  publishedIssueCount: number; // ÖK1
  publicationLanguages: string[]; // ÖK8
}

export interface WebsiteData {
  aimsAndScopeUrl: string; // ÖK9
  authorGuidelinesUrl: string; // K11, GH9
  publicationPolicyUrl: string; // K12
  journalInfoComplete: boolean; // ÖK8
  nameChanged: boolean; // GH2
  hasJournalHistory: boolean; // GH2
  indexingClaimsAccurate: boolean; // GH13
  abbreviationShown: boolean; // T4
}

export interface EditorialBoardsData {
  editorialBoardUrl: string; // K4
  boardOneThirdExternal: boolean; // K4
  hasFieldEditors: boolean; // K2
  hasLanguageEditors: boolean; // K3
  hasAdvisoryBoard: boolean; // K4
  boardCompetenceStated: boolean; // K5
}

export interface PeerReviewData {
  peerReviewPolicyUrl: string;
  minTwoReviewers: boolean; // K15
  reviewersFromDifferentInstitutions: boolean; // K6, K15
  thirdReviewerOnDisagreement: boolean; // GH14
  reportsKeptFiveYears: boolean; // GH4
  reportsShowScientificEvaluation: boolean; // K16
  canUploadReviewReportsPdf: boolean; // K16
  screensPlagiarism: boolean; // T3
  plagiarismPolicyUrl: string; // T3
  publishesReviewerList: boolean; // T1
}

export interface ArticleFormatData {
  sampleArticleUrl: string;
  abstractAndKeywordsInArticleLanguage: boolean; // ÖK10
  abstractWordLimitStated: boolean; // ÖK10
  publishesNonLatinScript: boolean; // ÖK11 gate
  latinScriptForNonLatin: boolean; // ÖK11
  articleTypeOnTocAndFirstPage: boolean; // ÖK12
  datesSubmissionAcceptanceShown: boolean; // ÖK13
  affiliationsAndOrcidShown: boolean; // ÖK13
  noAdsInsideArticles: boolean; // ÖK14
  referenceStyle: string; // GH9
  referencesLatinScript: boolean; // GH8
  footnoteReferencesListed: boolean; // GH10
  citationLineOnFirstPage: boolean; // GH11
  issueCoverHasNameYearVolumeIssue: boolean; // GH5
  pageNumberingContinuous: boolean; // K14
  pdfTextCopyable: boolean; // application process 1.3
  bilingualTitleAbstractKeywords: boolean; // T5
  bilingualTocTitles: boolean; // T2
}

export interface EthicsData {
  ethicsPolicyUrl: string; // K8.5
  separateSectionsForRoles: boolean; // K8.4
  referencesCopeOrIcmje: boolean; // K8.5
  statesResearchPublicationEthicsCompliance: boolean; // K8.3
  requiresEthicsCommitteeApproval: boolean; // K8.1, K8.2
  requiresInformedConsentForCaseReports: boolean; // K8.2
  requiresDeclarationsAtArticleEnd: boolean; // K13
  respectsCopyrightForWorksUsed: boolean; // K8.6
}

export interface ContentData {
  publishesOnTime: boolean; // K1
  researchArticlesLastYear: number; // K10
  totalScientificArticlesLastYear: number; // K10
  articleCountsBalanced: boolean; // K9
  authorInstitutionDiversity: boolean; // K7
  combinedIssuesLast3Years: number; // K17
  specialIssuesLastYear: number; // K18.3
  specialIssuesSeparatePaging: boolean; // K18.2
  onlyReviewOrCaseReportStated: boolean; // Derleme / Olgu sunumu dergileri 1
  metadataSubmissionMethod: MetadataSubmissionMethod | ''; // application agreement
}

export interface FormData {
  identity: IdentityData;
  website: WebsiteData;
  editorialBoards: EditorialBoardsData;
  peerReview: PeerReviewData;
  articleFormat: ArticleFormatData;
  ethics: EthicsData;
  content: ContentData;
}

/** Values from other sections that some validators need for thresholds. */
export interface ValidationContext {
  subjectArea: SubjectArea | '';
  issuesPerYear: number;
}
