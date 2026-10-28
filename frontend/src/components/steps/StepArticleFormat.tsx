import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { CheckboxField } from '../CheckboxField';
import { GroupHeading, SelectField, StepHeading } from '../FormControls';
import { URL_PATTERN } from '../../utils/validation';

const REFERENCE_STYLES = ['APA', 'MLA', 'AIP', 'NLM', 'AMA', 'ACS', 'Chicago', 'Other'] as const;

export function StepArticleFormat() {
  const { register, watch, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();
  const publishesNonLatinScript = watch('articleFormat.publishesNonLatinScript');

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.articleFormat.title')}</StepHeading>
      <LinkField
        label={t('step.articleFormat.sampleArticleUrl')}
        hint={t('step.articleFormat.sampleArticleUrlHint')}
        error={errors.articleFormat?.sampleArticleUrl?.message}
        {...register('articleFormat.sampleArticleUrl', {
          required: t('validation.required'),
          pattern: { value: URL_PATTERN, message: t('validation.url') },
        })}
      />

      <GroupHeading>{t('step.articleFormat.groupFirstPage')}</GroupHeading>
      <CheckboxField name="articleFormat.abstractAndKeywordsInArticleLanguage" />
      <CheckboxField name="articleFormat.abstractWordLimitStated" />
      <CheckboxField name="articleFormat.publishesNonLatinScript" />
      {publishesNonLatinScript && <CheckboxField name="articleFormat.latinScriptForNonLatin" />}
      <CheckboxField name="articleFormat.articleTypeOnTocAndFirstPage" />
      <CheckboxField name="articleFormat.datesSubmissionAcceptanceShown" />
      <CheckboxField name="articleFormat.affiliationsAndOrcidShown" />
      <CheckboxField name="articleFormat.noAdsInsideArticles" />

      <GroupHeading>{t('step.articleFormat.groupReferences')}</GroupHeading>
      <SelectField
        name="articleFormat.referenceStyle"
        label={t('step.articleFormat.referenceStyle')}
        hint={t('step.articleFormat.referenceStyleHint')}
        placeholder={t('step.articleFormat.referenceStyleSelect')}
        options={REFERENCE_STYLES.map((v) => ({ value: v, label: t(`option.referenceStyle.${v}`) }))}
      />
      <CheckboxField name="articleFormat.referencesLatinScript" />
      <CheckboxField name="articleFormat.footnoteReferencesListed" />
      <CheckboxField name="articleFormat.citationLineOnFirstPage" />

      <GroupHeading>{t('step.articleFormat.groupIssue')}</GroupHeading>
      <CheckboxField name="articleFormat.issueCoverHasNameYearVolumeIssue" />
      <CheckboxField name="articleFormat.pageNumberingContinuous" />
      <CheckboxField name="articleFormat.pdfTextCopyable" />

      <GroupHeading>{t('step.articleFormat.groupRecommended')}</GroupHeading>
      <CheckboxField name="articleFormat.bilingualTitleAbstractKeywords" />
      <CheckboxField name="articleFormat.bilingualTocTitles" />
    </section>
  );
}
