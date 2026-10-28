import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportResponse, ReportItem } from '../../types/form.types';
import { SummaryBanner } from './SummaryBanner';
import { IssueCard } from './IssueCard';
import { downloadReportHtml } from '../../utils/exportReport';

interface Props {
  report: ReportResponse;
  onReset: () => void;
  onBack: () => void;
}

function buildPlainText(report: ReportResponse, lang: string, t: (key: string) => string): string {
  const all = report.items ?? report.issues;
  const lines = [
    t('app.title'),
    `Generated: ${new Date().toLocaleString(lang)}`,
    '',
    `Overall Status: ${report.overallStatus.toUpperCase()}`,
    `Passed: ${report.passCount}  |  Warnings: ${report.warningCount}  |  Failures: ${report.failCount}`,
    '',
    '--- All Checks ---',
    ...all.map(
      (i) =>
        `[${i.status.toUpperCase()}] ${i.section} / ${i.field}\n  ${i.message}${
          i.suggestion ? '\n  ' + t('report.suggestionLabel') + ' ' + i.suggestion : ''
        }${i.url ? '\n  URL: ' + i.url : ''}`,
    ),
    '',
    '--- Disclaimer ---',
    t('report.trdizinDisclaimer'),
  ];
  return lines.join('\n');
}

function PassCard({ item }: { item: ReportItem }) {
  return (
    <div className="rounded-md bg-green-50 p-3 ring-1 ring-green-200">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-green-600">✓</span>
        <div className="flex-1 text-sm">
          <div className="font-medium text-green-900">
            {item.section} / {item.field}
          </div>
          <div className="text-green-800">{item.message}</div>
        </div>
      </div>
    </div>
  );
}

export function ReportDashboard({ report, onReset, onBack }: Props) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showPasses, setShowPasses] = useState(false);

  const all = report.items ?? report.issues;
  const issues = all.filter((i) => i.status !== 'pass');
  const passes = all.filter((i) => i.status === 'pass');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPlainText(report, i18n.language, t));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SummaryBanner
        status={report.overallStatus}
        passCount={report.passCount}
        failCount={report.failCount}
      />

      {issues.length === 0 ? (
        <div className="rounded-md bg-white p-6 text-center text-gray-700 shadow-sm ring-1 ring-gray-200">
          {t('report.noIssues')}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('report.itemsNeedAttention_other', { count: issues.length })}
          </h2>
          {issues.map((item, idx) => (
            <IssueCard key={`${item.section}-${item.field}-${idx}`} item={item} />
          ))}
        </div>
      )}

      {passes.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPasses((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 print:hidden"
          >
            <span>{showPasses ? '▼' : '▶'}</span>
            <span>
              {t(showPasses ? 'report.hidePassedChecks' : 'report.showPassedChecks', {
                count: passes.length,
              })}
            </span>
          </button>
          <div className={`space-y-2 ${showPasses ? '' : 'hidden print:block'}`}>
            {passes.map((item, idx) => (
              <PassCard key={`pass-${item.section}-${item.field}-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}

      <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        {t('report.trdizinDisclaimer')}
      </p>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          {t('report.editData')}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          {copied ? t('report.copied') : t('report.copyReport')}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          {t('report.printSavePdf')}
        </button>
        <button
          type="button"
          onClick={() => downloadReportHtml(report, i18n.language, t)}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          {t('report.downloadHtml')}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          {t('report.newAssessment')}
        </button>
      </div>
    </div>
  );
}
