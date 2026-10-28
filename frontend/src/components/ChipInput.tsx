import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
}

export function ChipInput({ label, values, onChange, hint }: ChipInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !values.includes(s));
    if (items.length > 0) onChange([...values, ...items]);
    setInput('');
  };

  const remove = (item: string) => onChange(values.filter((v) => v !== item));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {values.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-sm text-blue-700"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={t('chipInput.remove', { item })}
              className="text-blue-400 hover:text-blue-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[10rem] flex-1 border-0 p-0.5 text-sm focus:outline-none focus:ring-0"
          value={input}
          placeholder={values.length === 0 ? t('chipInput.placeholder') : ''}
          onChange={(e) => {
            if (e.target.value.includes(',')) add(e.target.value);
            else setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
              remove(values[values.length - 1]);
            }
          }}
          onBlur={() => input.trim() && add(input)}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
