import { useTranslation } from 'react-i18next';
import { CRITERIA_URL } from '../utils/exportReport';

/** One-line legend that explains the criterion numbers cited in hints and report messages. */
export function CriteriaLegend({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={`text-xs text-gray-600 ${className}`.trim()}>
      <span className="font-medium">{t('legend.title')}.</span> {t('legend.text')}{' '}
      <a
        href={CRITERIA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {t('legend.link')}
      </a>
    </p>
  );
}
