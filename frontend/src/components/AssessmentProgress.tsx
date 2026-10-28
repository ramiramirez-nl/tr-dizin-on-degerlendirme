import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SectionStatus = 'checking' | 'pass' | 'warning' | 'fail';

// Maps the section names streamed by the backend to the already-translated
// step navigation labels, so no new translation keys are needed per section.
const SECTION_TO_STEP_KEY: Record<string, string> = {
  Identity: 'steps.identity',
  Website: 'steps.website',
  'Editorial Boards': 'steps.editorialBoards',
  'Peer Review': 'steps.peerReview',
  'Article Format': 'steps.articleFormat',
  Ethics: 'steps.ethics',
  Content: 'steps.content',
};

const statusIcon: Record<SectionStatus, string> = {
  checking: '',
  pass: '✓',
  warning: '⚠',
  fail: '✗',
};

const statusColor: Record<SectionStatus, string> = {
  checking: 'text-gray-400',
  pass: 'text-green-600',
  warning: 'text-yellow-600',
  fail: 'text-red-600',
};

interface Props {
  /** Section names in the order the backend declared them ('start' event). */
  sections: string[];
  /** Resolved status per section name, populated as 'section' events arrive. */
  statuses: Record<string, SectionStatus>;
}

export function AssessmentProgress({ sections, statuses }: Props) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const doneCount = sections.filter((s) => statuses[s] && statuses[s] !== 'checking').length;

  return (
    <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
      <div
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
        role="status"
        aria-label={t('progress.title')}
      />
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('progress.title')}</h2>

      {sections.length === 0 ? (
        <p className="mt-1 text-sm text-gray-600" aria-live="polite">
          {t('progress.phase.starting')}
        </p>
      ) : (
        <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left" aria-live="polite">
          {sections.map((section) => {
            const status = statuses[section] ?? 'checking';
            return (
              <li key={section} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{t(SECTION_TO_STEP_KEY[section] ?? section)}</span>
                <span className={`font-medium ${statusColor[status]}`}>
                  {status === 'checking' ? (
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-gray-300" />
                  ) : (
                    <>
                      {statusIcon[status]} {t(`progress.sectionStatus.${status}`)}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: sections.length ? `${Math.round((100 * doneCount) / sections.length)}%` : '5%',
          }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {t('progress.elapsed', { seconds: elapsed })}
      </p>
      <p className="mt-4 text-xs text-gray-400">{t('progress.note')}</p>
    </div>
  );
}
