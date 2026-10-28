import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { CheckboxField } from '../CheckboxField';
import { NumberField, SelectField, StepHeading } from '../FormControls';

const METHODS = ['dergipark', 'trdizin_manual', 'trdizin_xml'] as const;

export function StepContent() {
  const { watch } = useFormContext<FormData>();
  const { t } = useTranslation();
  const subjectArea = watch('identity.subjectArea');
  const specialIssues = Number(watch('content.specialIssuesLastYear')) || 0;
  const singleType = subjectArea === 'review_only' || subjectArea === 'case_report_only';

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.content.title')}</StepHeading>
      <CheckboxField name="content.publishesOnTime" />
      {singleType ? (
        <CheckboxField name="content.onlyReviewOrCaseReportStated" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            name="content.researchArticlesLastYear"
            label={t('step.content.researchArticlesLastYear')}
            hint={t('step.content.researchArticlesLastYearHint')}
          />
          <NumberField
            name="content.totalScientificArticlesLastYear"
            label={t('step.content.totalScientificArticlesLastYear')}
            hint={t('step.content.totalScientificArticlesLastYearHint')}
          />
        </div>
      )}
      <CheckboxField name="content.articleCountsBalanced" />
      <CheckboxField name="content.authorInstitutionDiversity" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          name="content.combinedIssuesLast3Years"
          label={t('step.content.combinedIssuesLast3Years')}
          hint={t('step.content.combinedIssuesLast3YearsHint')}
        />
        <NumberField
          name="content.specialIssuesLastYear"
          label={t('step.content.specialIssuesLastYear')}
          hint={t('step.content.specialIssuesLastYearHint')}
        />
      </div>
      {specialIssues > 0 && <CheckboxField name="content.specialIssuesSeparatePaging" />}
      <SelectField
        name="content.metadataSubmissionMethod"
        label={t('step.content.metadataSubmissionMethod')}
        hint={t('step.content.metadataSubmissionMethodHint')}
        placeholder={t('step.content.metadataSubmissionMethodSelect')}
        options={METHODS.map((v) => ({ value: v, label: t(`option.metadataSubmissionMethod.${v}`) }))}
      />
    </section>
  );
}
