import { describe, it, expect } from 'vitest';
import { buildReportHtml } from './exportReport';
import type { ReportResponse } from '../types/form.types';
import tr from '../i18n/tr.json';

const dict = tr as Record<string, string>;
const t = (key: string, options?: Record<string, unknown>) =>
  (dict[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_m, name: string) => String(options?.[name] ?? ''));

const item = (status: 'pass' | 'warning' | 'fail', field: string) => ({
  section: 'Identity', field, status, message: `${field} mesajı`, suggestion: '',
});

describe('buildReportHtml', () => {
  const report = {
    overallStatus: 'fail',
    passCount: 1,
    failCount: 1,
    warningCount: 1,
    items: [item('pass', 'homepageUrl'), item('warning', 'issnOnline'), item('fail', 'publicationLanguageStated')],
    issues: [],
  } as unknown as ReportResponse;
  const html = buildReportHtml(report, 'tr', t);

  it('lists failures first, then warnings, then passes', () => {
    const order = ['publicationLanguageStated', 'issnOnline', 'homepageUrl'].map((f) => html.indexOf(`>${f}<`));
    expect(order[0]).toBeGreaterThan(0);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('writes a labelled summary and translated section names without CSS uppercase', () => {
    expect(html).toContain('1 kontrol geçti · 1 başarısız · 1 uyarı');
    expect(html).toContain('Kimlik');
    expect(html).not.toContain('text-transform:uppercase');
  });
});
