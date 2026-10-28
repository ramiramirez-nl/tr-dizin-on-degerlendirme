import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { CheckboxField } from '../CheckboxField';
import { StepHeading } from '../FormControls';
import { URL_PATTERN } from '../../utils/validation';

export function StepWebsite() {
  const { register, watch, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();
  const urlRules = {
    required: t('validation.required'),
    pattern: { value: URL_PATTERN, message: t('validation.url') },
  };
  const nameChanged = watch('website.nameChanged');

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.website.title')}</StepHeading>
      <LinkField
        label={t('step.website.aimsAndScopeUrl')}
        hint={t('step.website.aimsAndScopeUrlHint')}
        error={errors.website?.aimsAndScopeUrl?.message}
        {...register('website.aimsAndScopeUrl', urlRules)}
      />
      <LinkField
        label={t('step.website.authorGuidelinesUrl')}
        hint={t('step.website.authorGuidelinesUrlHint')}
        error={errors.website?.authorGuidelinesUrl?.message}
        {...register('website.authorGuidelinesUrl', urlRules)}
      />
      <LinkField
        label={t('step.website.publicationPolicyUrl')}
        hint={t('step.website.publicationPolicyUrlHint')}
        error={errors.website?.publicationPolicyUrl?.message}
        {...register('website.publicationPolicyUrl', urlRules)}
      />
      <CheckboxField name="website.journalInfoComplete" />
      <CheckboxField name="website.nameChanged" />
      {nameChanged && <CheckboxField name="website.hasJournalHistory" />}
      <CheckboxField name="website.indexingClaimsAccurate" />
      <CheckboxField name="website.abbreviationShown" />
    </section>
  );
}
