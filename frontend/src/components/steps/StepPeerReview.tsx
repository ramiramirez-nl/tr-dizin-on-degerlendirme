import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { CheckboxField } from '../CheckboxField';
import { StepHeading } from '../FormControls';
import { URL_PATTERN } from '../../utils/validation';

export function StepPeerReview() {
  const { register, watch, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();
  const urlRules = {
    required: t('validation.required'),
    pattern: { value: URL_PATTERN, message: t('validation.url') },
  };
  const screensPlagiarism = watch('peerReview.screensPlagiarism');

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.peerReview.title')}</StepHeading>
      <LinkField
        label={t('step.peerReview.peerReviewPolicyUrl')}
        hint={t('step.peerReview.peerReviewPolicyUrlHint')}
        error={errors.peerReview?.peerReviewPolicyUrl?.message}
        {...register('peerReview.peerReviewPolicyUrl', urlRules)}
      />
      <CheckboxField name="peerReview.minTwoReviewers" />
      <CheckboxField name="peerReview.reviewersFromDifferentInstitutions" />
      <CheckboxField name="peerReview.thirdReviewerOnDisagreement" />
      <CheckboxField name="peerReview.reportsKeptFiveYears" />
      <CheckboxField name="peerReview.reportsShowScientificEvaluation" />
      <CheckboxField name="peerReview.canUploadReviewReportsPdf" />
      <CheckboxField name="peerReview.screensPlagiarism" />
      {screensPlagiarism && (
        <LinkField
          label={t('step.peerReview.plagiarismPolicyUrl')}
          hint={t('step.peerReview.plagiarismPolicyUrlHint')}
          error={errors.peerReview?.plagiarismPolicyUrl?.message}
          {...register('peerReview.plagiarismPolicyUrl', urlRules)}
        />
      )}
      <CheckboxField name="peerReview.publishesReviewerList" />
    </section>
  );
}
