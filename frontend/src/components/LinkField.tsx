import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LinkFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const LinkField = forwardRef<HTMLInputElement, LinkFieldProps>(
  function LinkField({ label, hint, error, defaultValue, onChange, ...rest }, ref) {
    const { t } = useTranslation();
    // The input is uncontrolled (react-hook-form register), so mirror its
    // value locally to drive the "Open Link" button state.
    const [url, setUrl] = useState(typeof defaultValue === 'string' ? defaultValue : '');
    const looksLikeUrl = url.length > 3 && /\./.test(url) && !/\s/.test(url);
    const canOpen = looksLikeUrl;
    const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          <input
            ref={(el) => {
              if (typeof ref === 'function') ref(el);
              else if (ref) ref.current = el;
              if (el && el.value !== url) setUrl(el.value);
            }}
            type="url"
            defaultValue={defaultValue}
            placeholder="https://example.com/..."
            aria-invalid={error ? true : undefined}
            className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? 'border-red-400' : 'border-gray-300'
            }`}
            onChange={(e) => {
              setUrl(e.target.value);
              onChange?.(e);
            }}
            {...rest}
          />
          <button
            type="button"
            disabled={!canOpen}
            onClick={() => canOpen && window.open(fullUrl, '_blank', 'noopener')}
            className="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
          >
            {t('linkField.openLink')}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
