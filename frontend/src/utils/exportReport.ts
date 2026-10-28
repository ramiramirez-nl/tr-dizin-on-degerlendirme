import type { ReportResponse, ReportItem } from '../types/form.types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATUS_COLOR: Record<ReportItem['status'], string> = {
  pass: '#15803d',
  warning: '#a16207',
  fail: '#b91c1c',
};

function renderItem(item: ReportItem, suggestionLabel: string, evidenceLabel: string): string {
  const color = STATUS_COLOR[item.status];
  const parts = [
    `<div style="border:1px solid #e5e7eb;border-left:4px solid ${color};border-radius:6px;padding:12px;margin-bottom:10px;">`,
    `<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${color};font-weight:600;">${escapeHtml(item.status)} — ${escapeHtml(item.section)} / ${escapeHtml(item.field)}</div>`,
    `<div style="margin-top:4px;font-size:14px;color:#111827;">${escapeHtml(item.message)}</div>`,
  ];
  if (item.evidence) {
    parts.push(
      `<div style="margin-top:6px;font-size:13px;color:#4b5563;font-style:italic;"><strong style="font-style:normal;">${escapeHtml(evidenceLabel)}</strong> ${escapeHtml(item.evidence)}</div>`
    );
  }
  if (item.suggestion) {
    parts.push(
      `<div style="margin-top:6px;font-size:13px;color:#374151;"><strong>${escapeHtml(suggestionLabel)}</strong> ${escapeHtml(item.suggestion)}</div>`
    );
  }
  if (item.url) {
    parts.push(
      `<div style="margin-top:6px;"><a href="${escapeHtml(item.url)}" style="font-size:13px;color:#2563eb;">${escapeHtml(item.url)}</a></div>`
    );
  }
  parts.push('</div>');
  return parts.join('');
}

export function buildReportHtml(
  report: ReportResponse,
  lang: string,
  t: (key: string) => string
): string {
  const all = report.items ?? report.issues;
  const suggestionLabel = t('report.suggestionLabel');
  const evidenceLabel = t('report.evidenceLabel');
  const generated = new Date().toLocaleString(lang);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" dir="ltr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(t('app.title'))}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #111827; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .disclaimer { border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af; font-size: 12px; padding: 10px 12px; border-radius: 6px; margin-top: 24px; }
</style>
</head>
<body>
  <h1>${escapeHtml(t('app.title'))}</h1>
  <div class="meta">${escapeHtml(generated)} — ${escapeHtml(report.overallStatus.toUpperCase())} · ${report.passCount} / ${report.failCount} / ${report.warningCount}</div>
  ${all.map((item) => renderItem(item, suggestionLabel, evidenceLabel)).join('\n')}
  <div class="disclaimer">${escapeHtml(t('report.trdizinDisclaimer'))}</div>
</body>
</html>
`;
}

export function downloadReportHtml(report: ReportResponse, lang: string, t: (key: string) => string): void {
  const html = buildReportHtml(report, lang, t);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tr-dizin-on-degerlendirme-raporu.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
