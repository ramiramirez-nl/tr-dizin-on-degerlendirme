import { useTranslation } from 'react-i18next';

type OverallStatus = 'pass' | 'fail' | 'warning';

interface Props {
  status: OverallStatus;
  passCount: number;
  failCount: number;
}

export function SummaryBanner({ status, passCount, failCount }: Props) {
  const { t } = useTranslation();
  const styles: Record<OverallStatus, { bg: string; icon: string }> = {
    pass: { bg: 'bg-green-50 border-green-300 text-green-900', icon: '✓' },
    warning: { bg: 'bg-yellow-50 border-yellow-300 text-yellow-900', icon: '!' },
    fail: { bg: 'bg-red-50 border-red-300 text-red-900', icon: '✕' },
  };
  const s = styles[status];
  return (
    <div className={`rounded-lg border p-4 ${s.bg}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-xl font-bold">
          {s.icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t(`summary.${status}`)}</h2>
          <p className="text-sm">{t('summary.checksInfo', { passCount, failCount })}</p>
        </div>
      </div>
    </div>
  );
}
