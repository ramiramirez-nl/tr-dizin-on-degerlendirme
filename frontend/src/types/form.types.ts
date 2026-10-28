/**
 * Mirror of backend/src/types/formData.ts (keep in sync) plus the
 * frontend-only `agreement` section, which is never sent to the backend.
 * Criterion references: ÖK = ön koşul, K = değerlendirme kriteri,
 * GH = genel husus, T = tavsiye (https://trdizin.gov.tr/kriterler/).
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

/** Frontend-only: the editor's confirmation of the application agreement (item 15). */
export interface AgreementData {
  acceptedCriteria: boolean;
}

export interface FormData {
  identity: IdentityData;
  website: WebsiteData;
  editorialBoards: EditorialBoardsData;
  peerReview: PeerReviewData;
  articleFormat: ArticleFormatData;
  ethics: EthicsData;
  content: ContentData;
  agreement: AgreementData;
}

export type CheckStatus = 'pass' | 'fail' | 'warning';

export interface ReportItem {
  section: string;
  field: string;
  status: CheckStatus;
  message: string;
  suggestion: string;
  url?: string;
  criteriaUrl?: string;
  confidence?: 'high' | 'medium' | 'low';
  evidence?: string;
}

export interface ReportResponse {
  overallStatus: 'pass' | 'fail' | 'warning';
  passCount: number;
  failCount: number;
  warningCount: number;
  /** All results, including passes (sent by newer backend) */
  items?: ReportItem[];
  /** Non-pass items only (legacy) */
  issues: ReportItem[];
}
