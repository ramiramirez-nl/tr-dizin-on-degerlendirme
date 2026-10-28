import { useFormContext, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FormData } from '../types/form.types';

export const inputCls =
  'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function errorMessage(errors: unknown, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' ? message : undefined;
}

interface NumberFieldProps {
  name: FieldPath<FormData>;
  label: string;
  hint?: string;
}

/** Non-negative whole-number input; an empty box is stored as 0 (never NaN). */
export function NumberField({ name, label, hint }: NumberFieldProps) {
  const { register, formState: { errors } } = useFormContext<FormData>();
  const { t } = useTranslation();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min={0}
        step={1}
        className={inputCls}
        {...register(name, {
          setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Number(v)),
          min: { value: 0, message: t('validation.nonNegative') },
        })}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <FieldError message={errorMessage(errors, name)} />
    </div>
  );
}

interface SelectFieldProps {
  name: FieldPath<FormData>;
  label: string;
  hint?: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

export function SelectField({ name, label, hint, placeholder, options }: SelectFieldProps) {
  const { register } = useFormContext<FormData>();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select className={inputCls} {...register(name)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function StepHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-gray-900">{children}</h2>;
}

export function GroupHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-gray-200 pb-1 pt-2 text-sm font-semibold text-gray-800">{children}</h3>;
}
