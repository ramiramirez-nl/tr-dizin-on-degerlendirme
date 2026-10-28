import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { CheckboxField } from '../CheckboxField';
import { StepHeading } from '../FormControls';
import { URL_PATTERN } from '../../utils/validation';

export function StepEthics() {
  const { register, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.ethics.title')}</StepHeading>
      <LinkField
        label={t('step.ethics.ethicsPolicyUrl')}
        hint={t('step.ethics.ethicsPolicyUrlHint')}
        error={errors.ethics?.ethicsPolicyUrl?.message}
        {...register('ethics.ethicsPolicyUrl', {
          required: t('validation.required'),
          pattern: { value: URL_PATTERN, message: t('validation.url') },
        })}
      />
      <CheckboxField name="ethics.separateSectionsForRoles" />
      <CheckboxField name="ethics.referencesCopeOrIcmje" />
      <CheckboxField name="ethics.statesResearchPublicationEthicsCompliance" />
      <CheckboxField name="ethics.requiresEthicsCommitteeApproval" />
      <CheckboxField name="ethics.requiresInformedConsentForCaseReports" />
      <CheckboxField name="ethics.requiresDeclarationsAtArticleEnd" />
      <CheckboxField name="ethics.respectsCopyrightForWorksUsed" />
    </section>
  );
}
