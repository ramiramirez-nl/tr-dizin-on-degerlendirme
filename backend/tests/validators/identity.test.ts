import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/issn/issnClient', () => ({ lookupIssn: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { lookupIssn } from '../../src/issn/issnClient';
import { analyzePageContent } from '../../src/ai/aiClient';
import { validateIdentity } from '../../src/validators/identity';
import type { IdentityData, ValidationContext } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const issn = lookupIssn as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

const base: IdentityData = {
  journalTitle: 'Test Dergisi',
  homepageUrl: 'https://example.com',
  issnPrint: '',
  issnOnline: '1234-5678',
  subjectArea: 'social_humanities',
  issuesPerYear: 2,
  publishedIssueCount: 4,
  publicationLanguages: ['Türkçe'],
};
const ctx = (d: IdentityData): ValidationContext => ({
  subjectArea: d.subjectArea,
  issuesPerYear: d.issuesPerYear,
});
const run = (d: IdentityData, lang?: string) => validateIdentity(d, lang, ctx(d));
const byField = (items: { field: string }[], field: string) =>
  items.find((i) => i.field === field) as { status: string; message: string; suggestion: string };

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'Test Dergisi ISSN 1234-5678 hakemli', links: [], statusCode: 200 });
  issn.mockResolvedValue({ valid: true, registeredTitle: 'Test Dergisi', issn: '1234-5678' });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

describe('validateIdentity', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(base, 'tr');
    expect(items.every((i) => i.status === 'pass')).toBe(true);
    expect(items.every((i) => i.section === 'Identity')).toBe(true);
    for (const f of ['homepageUrl', 'issnOnline', 'issnOnHomepage', 'peerReviewedStatement', 'publicationLanguageStated', 'publicationLanguages', 'issuesPerYear', 'publishedIssueCount']) {
      expect(byField(items, f)?.status).toBe('pass');
    }
  });

  it('fails the homepage on HTTP errors and downgrades AI checks to warnings', async () => {
    scrape.mockResolvedValue({ accessible: false, text: '', links: [], statusCode: 404, errorType: 'http' });
    const items = await run(base);
    expect(byField(items, 'homepageUrl').status).toBe('fail');
    for (const f of ['issnOnHomepage', 'peerReviewedStatement', 'publicationLanguageStated']) {
      expect(byField(items, f).status).toBe('warning');
    }
    expect(ai).not.toHaveBeenCalled();
  });

  it('treats a homepage timeout as a warning', async () => {
    scrape.mockResolvedValue({ accessible: false, text: '', links: [], statusCode: 0, errorType: 'timeout' });
    expect(byField(await run(base), 'homepageUrl').status).toBe('warning');
  });

  it('fails when no ISSN is provided', async () => {
    const items = await run({ ...base, issnOnline: '', issnPrint: '' }, 'tr');
    const item = byField(items, 'issnOnline');
    expect(item.status).toBe('fail');
    expect(item.suggestion).toContain('Kültür ve Turizm Bakanlığı');
    expect(lookupIssn).not.toHaveBeenCalled();
  });

  it('fails an unregistered ISSN and warns when issn.org is unreachable', async () => {
    issn.mockResolvedValue({ valid: false, registeredTitle: '', issn: '1234-5678' });
    expect(byField(await run(base), 'issnOnline').status).toBe('fail');
    issn.mockResolvedValue({ valid: false, registeredTitle: '', issn: '1234-5678', lookupFailed: true });
    expect(byField(await run(base), 'issnOnline').status).toBe('warning');
  });

  it('warns on a title that does not match the ISSN record, and uses the print ISSN field', async () => {
    issn.mockResolvedValue({ valid: true, registeredTitle: 'Tamamen Farklı Ad', issn: '1234-5678' });
    const items = await run({ ...base, issnOnline: '', issnPrint: '1234-5678' });
    expect(byField(items, 'issnPrint').status).toBe('pass');
    expect(byField(items, 'journalTitle').status).toBe('warning');
  });

  it('accepts registered titles with a qualifier such as (Online)', async () => {
    issn.mockResolvedValue({ valid: true, registeredTitle: 'Test Dergisi (Online)', issn: '1234-5678' });
    expect(byField(await run(base), 'journalTitle')).toBeUndefined();
  });

  it('fails the three homepage AI checks when the criteria are not found', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: 'yok', issues: [] });
    const items = await run(base);
    for (const f of ['issnOnHomepage', 'peerReviewedStatement', 'publicationLanguageStated']) {
      expect(byField(items, f).status).toBe('fail');
    }
  });

  it('keeps the AI evidence out of the fail message so it is shown only once', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: 'yok', issues: [] });
    const item = byField(await run(base), 'publicationLanguageStated');
    expect(item.evidence).toBe('yok');
    expect(item.message).not.toContain('yok');
    expect(item.message).toContain('(Ön Koşul 8)');
  });

  it('omits the evidence field when the AI returned no quotation', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: '', issues: [] });
    const item = byField(await run(base), 'publicationLanguageStated');
    expect(item.status).toBe('fail');
    expect(item.evidence).toBeUndefined();
  });

  it('warns on all AI checks when AI is skipped', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 'skipped', issues: [], skipped: true });
    const items = await run(base);
    for (const f of ['issnOnHomepage', 'peerReviewedStatement', 'publicationLanguageStated']) {
      expect(byField(items, f).status).toBe('warning');
    }
  });

  it('fails when no publication language is given or no issue is published', async () => {
    const items = await run({ ...base, publicationLanguages: [], publishedIssueCount: 0 });
    expect(byField(items, 'publicationLanguages').status).toBe('fail');
    expect(byField(items, 'publishedIssueCount').status).toBe('fail');
  });

  it.each([
    ['health', 2, 'fail'],
    ['health', 3, 'pass'],
    ['engineering_science_vet', 1, 'fail'],
    ['engineering_science_vet', 2, 'pass'],
    ['social_humanities', 0, 'fail'],
    ['social_humanities', 1, 'pass'],
    ['review_only', 1, 'pass'],
    ['case_report_only', 0, 'fail'],
  ] as const)('issuesPerYear for %s with %i issues is %s', async (subjectArea, issuesPerYear, expected) => {
    const items = await run({ ...base, subjectArea, issuesPerYear });
    expect(byField(items, 'issuesPerYear').status).toBe(expected);
  });

  it('warns when no subject area is chosen', async () => {
    expect(byField(await run({ ...base, subjectArea: '' }), 'issuesPerYear').status).toBe('warning');
  });

  it('writes Turkish by default and English for language en', async () => {
    const bad = { ...base, publicationLanguages: [] };
    expect(byField(await run(bad, 'tr'), 'publicationLanguages').message).toContain('belirtilmedi');
    expect(byField(await run(bad), 'publicationLanguages').message).toContain('belirtilmedi');
    expect(byField(await run(bad, 'en'), 'publicationLanguages').message).toContain('No publication language');
    expect(byField(await run(bad, 'tr'), 'publicationLanguages').message).toContain('(Ön Koşul 8)');
  });
});
