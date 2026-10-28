import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { ChipInput } from '../ChipInput';
import { FieldError, NumberField, SelectField, StepHeading, inputCls } from '../FormControls';
import { URL_PATTERN, ISSN_PATTERN } from '../../utils/validation';

const SUBJECT_AREAS = [
  'health',
  'engineering_science_vet',
  'social_humanities',
  'review_only',
  'case_report_only',
] as const;

export function StepIdentity() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();

  const issnRule = (value: string | undefined) =>
    !value || ISSN_PATTERN.test(value) || t('validation.issn');

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.identity.title')}</StepHeading>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('step.identity.journalTitle')}</label>
        <input
          className={inputCls}
          {...register('identity.journalTitle', { required: t('validation.required') })}
        />
        <p className="mt-1 text-xs text-gray-500">{t('step.identity.journalTitleHint')}</p>
        <FieldError message={errors.identity?.journalTitle?.message} />
      </div>
      <LinkField
        label={t('step.identity.homepageUrl')}
        hint={t('step.identity.homepageUrlHint')}
        error={errors.identity?.homepageUrl?.message}
        {...register('identity.homepageUrl', {
          required: t('validation.required'),
          pattern: { value: URL_PATTERN, message: t('validation.url') },
        })}
      />
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('step.identity.issnPrint')}</label>
            <input
              className={inputCls}
              placeholder="1234-5678"
              {...register('identity.issnPrint', { validate: issnRule })}
            />
            <FieldError message={errors.identity?.issnPrint?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('step.identity.issnOnline')}</label>
            <input
              className={inputCls}
              placeholder="1234-5678"
              {...register('identity.issnOnline', {
                validate: {
                  format: issnRule,
                  atLeastOne: (value, formValues) =>
                    Boolean(value) ||
                    Boolean(formValues.identity.issnPrint) ||
                    t('validation.issnRequired'),
                },
              })}
            />
            <FieldError message={errors.identity?.issnOnline?.message} />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">{t('step.identity.issnHint')}</p>
      </div>
      <SelectField
        name="identity.subjectArea"
        label={t('step.identity.subjectArea')}
        hint={t('step.identity.subjectAreaHint')}
        placeholder={t('step.identity.subjectAreaSelect')}
        options={SUBJECT_AREAS.map((v) => ({ value: v, label: t(`option.subjectArea.${v}`) }))}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          name="identity.issuesPerYear"
          label={t('step.identity.issuesPerYear')}
          hint={t('step.identity.issuesPerYearHint')}
        />
        <NumberField
          name="identity.publishedIssueCount"
          label={t('step.identity.publishedIssueCount')}
          hint={t('step.identity.publishedIssueCountHint')}
        />
      </div>
      <ChipInput
        label={t('step.identity.publicationLanguages')}
        hint={t('step.identity.publicationLanguagesHint')}
        values={watch('identity.publicationLanguages') ?? []}
        onChange={(v) => setValue('identity.publicationLanguages', v, { shouldDirty: true })}
      />
    </section>
  );
}
