import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, type FieldErrors, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData, ReportResponse } from './types/form.types';
import { submitAssessmentStream } from './api/client';
import { useMultiStepForm } from './hooks/useMultiStepForm';
import { loadDraft, saveDraft, clearDraft } from './utils/draft';
import { Stepper } from './components/Stepper';
import { CriteriaLegend } from './components/CriteriaLegend';
import { LanguageSelector } from './components/LanguageSelector';
import { AssessmentProgress, type SectionStatus } from './components/AssessmentProgress';
import { StepIdentity } from './components/steps/StepIdentity';
import { StepWebsite } from './components/steps/StepWebsite';
import { StepEditorialBoards } from './components/steps/StepEditorialBoards';
import { StepPeerReview } from './components/steps/StepPeerReview';
import { StepArticleFormat } from './components/steps/StepArticleFormat';
import { StepEthics } from './components/steps/StepEthics';
import { StepContent } from './components/steps/StepContent';
import { StepReview } from './components/steps/StepReview';
import { ReportDashboard } from './components/Report/ReportDashboard';

const STEP_KEYS = [
  'steps.identity',
  'steps.website',
  'steps.editorialBoards',
  'steps.peerReview',
  'steps.articleFormat',
  'steps.ethics',
  'steps.content',
  'steps.review',
] as const;

// Fields validated when leaving each step (and used to map errors to steps).
const STEP_FIELDS: FieldPath<FormData>[][] = [
  ['identity.journalTitle', 'identity.homepageUrl', 'identity.issnPrint', 'identity.issnOnline'],
  ['website.aimsAndScopeUrl', 'website.authorGuidelinesUrl', 'website.publicationPolicyUrl'],
  ['editorialBoards.editorialBoardUrl'],
  ['peerReview.peerReviewPolicyUrl', 'peerReview.plagiarismPolicyUrl'],
  ['articleFormat.sampleArticleUrl'],
  ['ethics.ethicsPolicyUrl'],
  [],
  ['agreement.acceptedCriteria'],
];

const DEFAULT_VALUES: FormData = {
  identity: {
    journalTitle: '',
    homepageUrl: '',
    issnPrint: '',
    issnOnline: '',
    subjectArea: '',
    issuesPerYear: 0,
    publishedIssueCount: 0,
    publicationLanguages: [],
  },
  website: {
    aimsAndScopeUrl: '',
    authorGuidelinesUrl: '',
    publicationPolicyUrl: '',
    journalInfoComplete: false,
    nameChanged: false,
    hasJournalHistory: false,
    indexingClaimsAccurate: false,
    abbreviationShown: false,
  },
  editorialBoards: {
    editorialBoardUrl: '',
    boardOneThirdExternal: false,
    hasFieldEditors: false,
    hasLanguageEditors: false,
    hasAdvisoryBoard: false,
    boardCompetenceStated: false,
  },
  peerReview: {
    peerReviewPolicyUrl: '',
    minTwoReviewers: false,
    reviewersFromDifferentInstitutions: false,
    thirdReviewerOnDisagreement: false,
    reportsKeptFiveYears: false,
    reportsShowScientificEvaluation: false,
    canUploadReviewReportsPdf: false,
    screensPlagiarism: false,
    plagiarismPolicyUrl: '',
    publishesReviewerList: false,
  },
  articleFormat: {
    sampleArticleUrl: '',
    abstractAndKeywordsInArticleLanguage: false,
    abstractWordLimitStated: false,
    publishesNonLatinScript: false,
    latinScriptForNonLatin: false,
    articleTypeOnTocAndFirstPage: false,
    datesSubmissionAcceptanceShown: false,
    affiliationsAndOrcidShown: false,
    noAdsInsideArticles: false,
    referenceStyle: '',
    referencesLatinScript: false,
    footnoteReferencesListed: false,
    citationLineOnFirstPage: false,
    issueCoverHasNameYearVolumeIssue: false,
    pageNumberingContinuous: false,
    pdfTextCopyable: false,
    bilingualTitleAbstractKeywords: false,
    bilingualTocTitles: false,
  },
  ethics: {
    ethicsPolicyUrl: '',
    separateSectionsForRoles: false,
    referencesCopeOrIcmje: false,
    statesResearchPublicationEthicsCompliance: false,
    requiresEthicsCommitteeApproval: false,
    requiresInformedConsentForCaseReports: false,
    requiresDeclarationsAtArticleEnd: false,
    respectsCopyrightForWorksUsed: false,
  },
  content: {
    publishesOnTime: false,
    researchArticlesLastYear: 0,
    totalScientificArticlesLastYear: 0,
    articleCountsBalanced: false,
    authorInstitutionDiversity: false,
    combinedIssuesLast3Years: 0,
    specialIssuesLastYear: 0,
    specialIssuesSeparatePaging: false,
    onlyReviewOrCaseReportStated: false,
    metadataSubmissionMethod: '',
  },
  agreement: { acceptedCriteria: false },
};

function worstStatus(items: { status: 'pass' | 'warning' | 'fail' }[]): SectionStatus {
  if (items.some((i) => i.status === 'fail')) return 'fail';
  if (items.some((i) => i.status === 'warning')) return 'warning';
  return 'pass';
}

function fieldError(errors: FieldErrors<FormData>, path: string): boolean {
  let node: unknown = errors;
  for (const key of path.split('.')) {
    if (!node || typeof node !== 'object') return false;
    node = (node as Record<string, unknown>)[key];
  }
  return Boolean(node);
}

function App() {
  const { t } = useTranslation();
  const [initialDraft] = useState(() => loadDraft(DEFAULT_VALUES));
  const [draftNotice, setDraftNotice] = useState(initialDraft !== null);
  const methods = useForm<FormData>({
    defaultValues: initialDraft ?? DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const accepted = methods.watch('agreement.acceptedCriteria');
  const stepper = useMultiStepForm(STEP_KEYS.length);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressSections, setProgressSections] = useState<string[]>([]);
  const [progressStatuses, setProgressStatuses] = useState<Record<string, SectionStatus>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Persist the form as a draft (debounced) so a refresh never loses work.
  useEffect(() => {
    const subscription = methods.watch((values) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraft(values), 500);
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [methods]);

  const { errors } = methods.formState;
  const errorSteps = STEP_FIELDS.flatMap((fields, idx) =>
    fields.some((f) => fieldError(errors, f)) ? [idx] : [],
  );

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    setProgressSections([]);
    setProgressStatuses({});
    try {
      const result = await submitAssessmentStream(data, {
        onStart: (event) => setProgressSections(event.sections),
        onSection: (event) =>
          setProgressStatuses((prev) => ({ ...prev, [event.section]: worstStatus(event.items) })),
      });
      setReport(result);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // When submit is blocked by validation, jump to the first step with errors.
  const onInvalid = (errs: FieldErrors<FormData>) => {
    const idx = STEP_FIELDS.findIndex((fields) => fields.some((f) => fieldError(errs, f)));
    if (idx >= 0) stepper.goTo(idx);
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[stepper.currentStep];
    const valid = fields.length === 0 || (await methods.trigger(fields));
    if (valid) stepper.next();
  };

  const reset = () => {
    if (!window.confirm(t('report.confirmNew'))) return;
    setReport(null);
    setError(null);
    clearDraft();
    setDraftNotice(false);
    methods.reset(DEFAULT_VALUES);
    stepper.goTo(0);
  };

  const handleClearDraft = () => {
    clearDraft();
    setDraftNotice(false);
    methods.reset(DEFAULT_VALUES);
    stepper.goTo(0);
  };

  const goBackToReview = () => {
    setReport(null);
    setError(null);
    stepper.goTo(STEP_KEYS.length - 1);
  };

  const stepLabels = STEP_KEYS.map((k) => t(k));

  const renderStep = () => {
    switch (stepper.currentStep) {
      case 0: return <StepIdentity />;
      case 1: return <StepWebsite />;
      case 2: return <StepEditorialBoards />;
      case 3: return <StepPeerReview />;
      case 4: return <StepArticleFormat />;
      case 5: return <StepEthics />;
      case 6: return <StepContent />;
      case 7: return <StepReview />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('app.title')}</h1>
              <p className="mt-1 text-sm text-gray-600">{t('app.subtitle')}</p>
              <div
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                dangerouslySetInnerHTML={{ __html: t('app.disclaimer') }}
              />
              <CriteriaLegend className="mt-2" />
            </div>
            <LanguageSelector />
          </div>
        </header>

        {report ? (
          <ReportDashboard report={report} onReset={reset} onBack={goBackToReview} />
        ) : submitting ? (
          <AssessmentProgress sections={progressSections} statuses={progressStatuses} />
        ) : (
          <FormProvider {...methods}>
            {draftNotice && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <span>{t('draft.restored')}</span>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-300 hover:bg-blue-100"
                >
                  {t('draft.clear')}
                </button>
              </div>
            )}
            <form
              onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
              className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
            >
              <Stepper
                steps={stepLabels}
                currentStep={stepper.currentStep}
                errorSteps={errorSteps}
                onStepClick={stepper.goTo}
              />
              {renderStep()}
              {error && (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={stepper.prev}
                  disabled={stepper.isFirst}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                >
                  {t('nav.back')}
                </button>
                {stepper.isLast ? (
                  <button
                    type="submit"
                    disabled={submitting || !accepted}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? t('nav.submitting') : t('nav.submit')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t('nav.next')}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
}

export default App;
