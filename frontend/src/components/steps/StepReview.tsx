import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { FieldError, StepHeading } from '../FormControls';
import { computeAgreement, type AgreementResult } from '../../utils/agreement';

const CRITERIA_URL = 'https://trdizin.gov.tr/kriterler/';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-gray-100 py-1 text-sm">
      <dt className="text-gray-600">{label}</dt>
      <dd className="col-span-2 break-words text-gray-900">
        {value || <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

/** Counts the checked boolean declarations of a section. */
function declarationCount(section: object | undefined): string {
  const values = Object.values(section ?? {}).filter((v): v is boolean => typeof v === 'boolean');
  return `${values.filter(Boolean).length} / ${values.length}`;
}

function AgreementMark({ result }: { result: AgreementResult }) {
  const { t } = useTranslation();
  if (result === null) {
    return <span className="w-5 shrink-0 text-center text-gray-400" title={t('agreement.notApplicable')}>—</span>;
  }
  return result ? (
    <span className="w-5 shrink-0 text-center font-bold text-green-600" title={t('agreement.met')}>✓</span>
  ) : (
    <span className="w-5 shrink-0 text-center font-bold text-red-600" title={t('agreement.notMet')}>✗</span>
  );
}

export function StepReview() {
  const { watch, register, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();
  const data = watch();
  const agreement = computeAgreement(data);

  const issn = [data.identity?.issnPrint, data.identity?.issnOnline].filter(Boolean).join(' / ');
  const subjectArea = data.identity?.subjectArea
    ? t(`option.subjectArea.${data.identity.subjectArea}`)
    : '';
  const method = data.content?.metadataSubmissionMethod
    ? t(`option.metadataSubmissionMethod.${data.content.metadataSubmissionMethod}`)
    : '';
  const num = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? '' : String(n));
  const declarations = (section: object | undefined) => (
    <Row label={t('step.review.declarations')} value={declarationCount(section)} />
  );

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.review.title')}</StepHeading>
      <p className="text-sm text-gray-600">{t('step.review.description')}</p>
      <div className="rounded-md border border-gray-200 p-4">
        <h3 className="mb-2 font-semibold">{t('steps.identity')}</h3>
        <dl>
          <Row label={t('step.review.journalTitle')} value={data.identity?.journalTitle} />
          <Row label={t('step.review.homepageUrl')} value={data.identity?.homepageUrl} />
          <Row label={t('step.review.issn')} value={issn} />
          <Row label={t('step.review.subjectArea')} value={subjectArea} />
          <Row label={t('step.review.issuesPerYear')} value={num(data.identity?.issuesPerYear)} />
          <Row label={t('step.review.publishedIssueCount')} value={num(data.identity?.publishedIssueCount)} />
          <Row label={t('step.review.publicationLanguages')} value={data.identity?.publicationLanguages?.join(', ')} />
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.website')}</h3>
        <dl>
          <Row label={t('step.review.aimsAndScopeUrl')} value={data.website?.aimsAndScopeUrl} />
          <Row label={t('step.review.authorGuidelinesUrl')} value={data.website?.authorGuidelinesUrl} />
          <Row label={t('step.review.publicationPolicyUrl')} value={data.website?.publicationPolicyUrl} />
          {declarations(data.website)}
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.editorialBoards')}</h3>
        <dl>
          <Row label={t('step.review.editorialBoardUrl')} value={data.editorialBoards?.editorialBoardUrl} />
          {declarations(data.editorialBoards)}
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.peerReview')}</h3>
        <dl>
          <Row label={t('step.review.peerReviewPolicyUrl')} value={data.peerReview?.peerReviewPolicyUrl} />
          <Row label={t('step.review.plagiarismPolicyUrl')} value={data.peerReview?.plagiarismPolicyUrl} />
          {declarations(data.peerReview)}
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.articleFormat')}</h3>
        <dl>
          <Row label={t('step.review.sampleArticleUrl')} value={data.articleFormat?.sampleArticleUrl} />
          <Row label={t('step.review.referenceStyle')} value={data.articleFormat?.referenceStyle} />
          {declarations(data.articleFormat)}
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.ethics')}</h3>
        <dl>
          <Row label={t('step.review.ethicsPolicyUrl')} value={data.ethics?.ethicsPolicyUrl} />
          {declarations(data.ethics)}
        </dl>
        <h3 className="mb-2 mt-4 font-semibold">{t('steps.content')}</h3>
        <dl>
          <Row label={t('step.review.researchArticlesLastYear')} value={num(data.content?.researchArticlesLastYear)} />
          <Row label={t('step.review.totalScientificArticlesLastYear')} value={num(data.content?.totalScientificArticlesLastYear)} />
          <Row label={t('step.review.combinedIssuesLast3Years')} value={num(data.content?.combinedIssuesLast3Years)} />
          <Row label={t('step.review.specialIssuesLastYear')} value={num(data.content?.specialIssuesLastYear)} />
          <Row label={t('step.review.metadataSubmissionMethod')} value={method} />
          {declarations(data.content)}
        </dl>
      </div>

      <div className="rounded-md border border-gray-200 p-4">
        <h3 className="font-semibold">{t('agreement.title')}</h3>
        <p className="mb-3 mt-1 text-xs text-gray-500">{t('agreement.description')}</p>
        <ol className="space-y-1.5">
          {agreement.map((result, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
              <AgreementMark result={result} />
              <span>
                {idx + 1}. {t(`agreement.item${idx + 1}`)}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4 border-t border-gray-100 pt-3">
          <label className="flex items-start gap-2 text-sm font-medium text-gray-900">
            <input
              type="checkbox"
              className="mt-0.5"
              {...register('agreement.acceptedCriteria', { required: t('agreement.required') })}
            />
            <span>15. {t('agreement.item15')}</span>
          </label>
          <a
            href={CRITERIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-6 mt-1 inline-block text-xs text-blue-700 underline"
          >
            {t('agreement.criteriaLink')}
          </a>
          <FieldError message={errors.agreement?.acceptedCriteria?.message} />
        </div>
      </div>
    </section>
  );
}
