import { z } from 'zod';

/**
 * Runtime validation for POST /api/assess bodies.
 *
 * Mirrors the interfaces in ../types/formData. identity, website, and
 * peerReview are required; the remaining sections default to empty objects so
 * partially filled forms still assess. Tri-state booleans (yes / no /
 * unanswered) stay optional; validators treat `undefined` as "not declared".
 */

const urlField = z.string().trim().max(2000).default('');
const shortText = z.string().trim().max(500).default('');
const chipArray = z.array(z.string().trim().max(200)).max(50).default([]);
const triStateBool = z.boolean().optional();
const count = z.number().int().min(0).max(100000).default(0);

export const subjectAreaSchema = z
  .enum(['health', 'engineering_science_vet', 'social_humanities', 'review_only', 'case_report_only', ''])
  .default('');

const identitySchema = z.object({
  journalTitle: shortText,
  homepageUrl: urlField,
  issnPrint: z.string().trim().max(20).default(''),
  issnOnline: z.string().trim().max(20).default(''),
  subjectArea: subjectAreaSchema,
  issuesPerYear: count,
  publishedIssueCount: count,
  publicationLanguages: chipArray,
});

const websiteSchema = z.object({
  aimsAndScopeUrl: urlField,
  authorGuidelinesUrl: urlField,
  publicationPolicyUrl: urlField,
  journalInfoComplete: triStateBool,
  nameChanged: triStateBool,
  hasJournalHistory: triStateBool,
  indexingClaimsAccurate: triStateBool,
  abbreviationShown: triStateBool,
});

const editorialBoardsSchema = z.object({
  editorialBoardUrl: urlField,
  boardOneThirdExternal: triStateBool,
  hasFieldEditors: triStateBool,
  hasLanguageEditors: triStateBool,
  hasAdvisoryBoard: triStateBool,
  boardCompetenceStated: triStateBool,
});

const peerReviewSchema = z.object({
  peerReviewPolicyUrl: urlField,
  minTwoReviewers: triStateBool,
  reviewersFromDifferentInstitutions: triStateBool,
  thirdReviewerOnDisagreement: triStateBool,
  reportsKeptFiveYears: triStateBool,
  reportsShowScientificEvaluation: triStateBool,
  canUploadReviewReportsPdf: triStateBool,
  screensPlagiarism: triStateBool,
  plagiarismPolicyUrl: urlField,
  publishesReviewerList: triStateBool,
});

const articleFormatSchema = z.object({
  sampleArticleUrl: urlField,
  abstractAndKeywordsInArticleLanguage: triStateBool,
  abstractWordLimitStated: triStateBool,
  publishesNonLatinScript: triStateBool,
  latinScriptForNonLatin: triStateBool,
  articleTypeOnTocAndFirstPage: triStateBool,
  datesSubmissionAcceptanceShown: triStateBool,
  affiliationsAndOrcidShown: triStateBool,
  noAdsInsideArticles: triStateBool,
  referenceStyle: z.string().trim().max(50).default(''),
  referencesLatinScript: triStateBool,
  footnoteReferencesListed: triStateBool,
  citationLineOnFirstPage: triStateBool,
  issueCoverHasNameYearVolumeIssue: triStateBool,
  pageNumberingContinuous: triStateBool,
  pdfTextCopyable: triStateBool,
  bilingualTitleAbstractKeywords: triStateBool,
  bilingualTocTitles: triStateBool,
});

const ethicsSchema = z.object({
  ethicsPolicyUrl: urlField,
  separateSectionsForRoles: triStateBool,
  referencesCopeOrIcmje: triStateBool,
  statesResearchPublicationEthicsCompliance: triStateBool,
  requiresEthicsCommitteeApproval: triStateBool,
  requiresInformedConsentForCaseReports: triStateBool,
  requiresDeclarationsAtArticleEnd: triStateBool,
  respectsCopyrightForWorksUsed: triStateBool,
});

const contentSchema = z.object({
  publishesOnTime: triStateBool,
  researchArticlesLastYear: count,
  totalScientificArticlesLastYear: count,
  articleCountsBalanced: triStateBool,
  authorInstitutionDiversity: triStateBool,
  combinedIssuesLast3Years: count,
  specialIssuesLastYear: count,
  specialIssuesSeparatePaging: triStateBool,
  onlyReviewOrCaseReportStated: triStateBool,
  metadataSubmissionMethod: z.enum(['dergipark', 'trdizin_manual', 'trdizin_xml', '']).default(''),
});

export const assessRequestSchema = z.object({
  identity: identitySchema,
  website: websiteSchema,
  peerReview: peerReviewSchema,
  editorialBoards: editorialBoardsSchema.prefault({}),
  articleFormat: articleFormatSchema.prefault({}),
  ethics: ethicsSchema.prefault({}),
  content: contentSchema.prefault({}),
  language: z.string().trim().max(10).optional(),
});

export type AssessRequest = z.infer<typeof assessRequestSchema>;
