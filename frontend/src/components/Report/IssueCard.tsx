import { useTranslation } from 'react-i18next';
import type { ReportItem } from '../../types/form.types';

const styles: Record<ReportItem['status'], { ring: string; tag: string; label: string }> = {
  pass: { ring: 'ring-green-200', tag: 'bg-green-100 text-green-800', label: 'PASS' },
  warning: { ring: 'ring-yellow-200', tag: 'bg-yellow-100 text-yellow-800', label: 'WARNING' },
  fail: { ring: 'ring-red-200', tag: 'bg-red-100 text-red-800', label: 'FAIL' },
};

const confidenceTag: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-blue-100 text-blue-800',
  medium: 'bg-gray-100 text-gray-700',
  low: 'bg-gray-100 text-gray-500',
};

export function IssueCard({ item }: { item: ReportItem }) {
  const { t } = useTranslation();
  const s = styles[item.status];
  return (
    <article className={`rounded-md bg-white p-4 shadow-sm ring-1 ${s.ring}`}>
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.tag}`}>{s.label}</span>
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {item.section} · {item.field}
        </span>
        {item.confidence && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${confidenceTag[item.confidence]}`}>
            {t(`report.confidence${item.confidence[0].toUpperCase()}${item.confidence.slice(1)}`)}
          </span>
        )}
      </header>
      <p className="text-sm text-gray-900">{item.message}</p>
      {item.evidence && (
        <p className="mt-2 border-l-2 border-gray-200 pl-2 text-sm italic text-gray-600">
          <span className="font-medium not-italic">{t('report.evidenceLabel')} </span>
          {item.evidence}
        </p>
      )}
      {item.suggestion && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-medium">{t('report.suggestionLabel')} </span>
          {item.suggestion}
        </p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          {item.url}
        </a>
      )}
      {item.criteriaUrl && (
        <a
          href={item.criteriaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-xs text-gray-500 hover:underline"
        >
          {t('report.viewCriteria')} →
        </a>
      )}
    </article>
  );
}
