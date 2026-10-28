import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../../types/form.types';
import { LinkField } from '../LinkField';
import { CheckboxField } from '../CheckboxField';
import { StepHeading } from '../FormControls';
import { URL_PATTERN } from '../../utils/validation';

export function StepEditorialBoards() {
  const { register, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <StepHeading>{t('step.editorialBoards.title')}</StepHeading>
      <LinkField
        label={t('step.editorialBoards.editorialBoardUrl')}
        hint={t('step.editorialBoards.editorialBoardUrlHint')}
        error={errors.editorialBoards?.editorialBoardUrl?.message}
        {...register('editorialBoards.editorialBoardUrl', {
          required: t('validation.required'),
          pattern: { value: URL_PATTERN, message: t('validation.url') },
        })}
      />
      <CheckboxField name="editorialBoards.boardOneThirdExternal" />
      <CheckboxField name="editorialBoards.hasFieldEditors" />
      <CheckboxField name="editorialBoards.hasLanguageEditors" />
      <CheckboxField name="editorialBoards.hasAdvisoryBoard" />
      <CheckboxField name="editorialBoards.boardCompetenceStated" />
    </section>
  );
}
