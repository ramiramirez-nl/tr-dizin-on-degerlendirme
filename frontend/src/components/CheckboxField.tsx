import { useFormContext, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../types/form.types';

interface CheckboxFieldProps {
  /** Form path, e.g. `website.nameChanged`. Label key is `step.<path>`, hint key `step.<path>Hint`. */
  name: FieldPath<FormData>;
  label?: string;
  hint?: string;
}

/** Checkbox with a label and an optional hint (looked up from i18n by field path). */
export function CheckboxField({ name, label, hint }: CheckboxFieldProps) {
  const { register } = useFormContext<FormData>();
  const { t, i18n } = useTranslation();
  const labelKey = `step.${name}`;
  const hintKey = `${labelKey}Hint`;
  const hintText = hint ?? (i18n.exists(hintKey) ? t(hintKey) : undefined);

  return (
    <div>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" className="mt-0.5" {...register(name)} />
        <span>{label ?? t(labelKey)}</span>
      </label>
      {hintText && <p className="ml-6 mt-0.5 text-xs text-gray-500">{hintText}</p>}
    </div>
  );
}
