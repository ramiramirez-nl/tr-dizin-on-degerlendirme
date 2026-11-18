import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { analyzePageContent } from '../../src/ai/aiClient';

import { validateWebsite } from '../../src/validators/website';
import type { ValidationContext, WebsiteData } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'page', links: [], statusCode: 200 });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

const good: WebsiteData = {
  aimsAndScopeUrl: 'https://example.com/aims',
  authorGuidelinesUrl: 'https://example.com/guidelines',
  publicationPolicyUrl: 'https://example.com/policy',
  feePolicyUrl: '',
  journalInfoComplete: true,
  nameChanged: false,
  hasJournalHistory: false,
  indexingClaimsAccurate: true,
  abbreviationShown: true,
};
const run = (d: WebsiteData, lang?: string, ctx?: ValidationContext) => validateWebsite(d, lang, ctx) as Promise<Item[]>;

describe('validateWebsite', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items.every((i) => i.status === 'pass' && i.section === 'Website')).toBe(true);
    expect(items.map((i) => i.field)).toEqual([
      'aimsAndScopeUrl',
      'authorGuidelinesUrl',
      'publicationPolicyUrl',
      'feePolicyUrl',
      'journalInfoComplete',
      'hasJournalHistory',
      'indexingClaimsAccurate',
      'abbreviationShown',
    ]);
  });

  it('asks the AI about the citation style on the author guidelines page', async () => {
    await run(good);
    const criteria = ai.mock.calls.map((c) => c[0].criteria as string);
    expect(criteria.some((c) => c.includes('APA') && c.includes('MLA'))).toBe(true);
  });

  it('fails a missing URL and an unreachable URL', async () => {
    scrape.mockResolvedValue({ accessible: false, text: '', links: [], statusCode: 404, errorType: 'http' });
    const items = await run({ ...good, aimsAndScopeUrl: '' });
    expect(byField(items, 'aimsAndScopeUrl').status).toBe('fail');
    expect(byField(items, 'authorGuidelinesUrl').status).toBe('fail');
  });

  it('names the missing elements in the fail message', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: '', issues: ['ücret politikası', 'değerlendirme süresi'] });
    const item = byField(await run(good), 'publicationPolicyUrl');
    expect(item.status).toBe('fail');
    expect(item.message).toContain('Eksik görünenler: ücret politikası; değerlendirme süresi.');
  });

  it('warns instead of failing when the page was only read in part', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: '', issues: [], partial: true });
    const item = byField(await run(good), 'publicationPolicyUrl') as Item & { confidence?: string };
    expect(item.status).toBe('warning');
    expect(item.confidence).toBe('low');
    expect(item.message).toContain('okunan bölümlerinde bulunamadı');
  });

  it('passes the check keywords to the AI client', async () => {
    await run(good);
    const call = ai.mock.calls.find((c) => (c[0].criteria as string).includes('peer review') || (c[0].criteria as string).includes('open access'));
    expect(call?.[0].keywords).toContain('açık erişim');
  });

  it('looks for the fee policy on the publication policy page when no fee page is given', async () => {
    await run(good);
    const call = ai.mock.calls.find((c) => (c[0].criteria as string).includes('fee policy'));
    expect(call?.[0].url).toBe('https://example.com/policy');
  });

  it('accepts a separate fee page and recommends linking it from the publication policy', async () => {
    const item = byField(await run({ ...good, feePolicyUrl: 'https://example.com/fee' }), 'feePolicyUrl');
    expect(item.status).toBe('pass');
    expect(item.message).toContain('ayrı bir sayfada bulundu');
    const call = ai.mock.calls.find((c) => (c[0].criteria as string).includes('fee policy'));
    expect(call?.[0].url).toBe('https://example.com/fee');
  });

  it('reports missing author guidelines content as a warning, not a fail', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'medium', evidence: '', issues: [] });
    expect(byField(await run(good), 'authorGuidelinesUrl').status).toBe('warning');
    expect(byField(await run(good), 'publicationPolicyUrl').status).toBe('fail');
  });

  it('tells the AI which citation style the editor declared', async () => {
    const ctx: ValidationContext = { subjectArea: 'social_humanities', issuesPerYear: 2, referenceStyle: 'APA' };
    await run(good, 'tr', ctx);
    const call = ai.mock.calls.find((c) => (c[0].criteria as string).includes('citation style'));
    expect(call?.[0].criteria).toContain('declared the citation style as APA');
  });

  it('fails when the AI does not find the content', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: 'yok', issues: [] });
    const items = await run(good);
    expect(byField(items, 'publicationPolicyUrl').status).toBe('fail');
  });

  it('omits the evidence field when the AI returned no quotation', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: '', issues: [] });
    const item = byField(await run(good), 'publicationPolicyUrl');
    expect(item.status).toBe('fail');
    expect(item.evidence).toBeUndefined();
  });

  it('keeps the AI evidence out of the fail message so it is shown only once', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: 'kanit-metni', issues: [] });
    const item = byField(await run(good), 'publicationPolicyUrl');
    expect(item.evidence).toBe('kanit-metni');
    expect(item.message).not.toContain('kanit-metni');
    expect(item.message).toContain('Gerekli içerik bulunamadı.');
  });

  it('warns when AI verification is skipped', async () => {
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 'skipped', issues: [], skipped: true });
    const items = await run(good);
    for (const f of ['aimsAndScopeUrl', 'authorGuidelinesUrl', 'publicationPolicyUrl']) {
      expect(byField(items, f).status).toBe('warning');
    }
  });

  it('fails when the name changed without a journal history (GH 2)', async () => {
    const items = await run({ ...good, nameChanged: true, hasJournalHistory: false });
    expect(byField(items, 'hasJournalHistory').status).toBe('fail');
    const ok = await run({ ...good, nameChanged: true, hasJournalHistory: true });
    expect(byField(ok, 'hasJournalHistory').status).toBe('pass');
  });

  it('fails misleading indexing claims and warns on the soft declarations', async () => {
    const items = await run({ ...good, indexingClaimsAccurate: false, journalInfoComplete: undefined, abbreviationShown: false });
    expect(byField(items, 'indexingClaimsAccurate').status).toBe('fail');
    expect(byField(items, 'journalInfoComplete').status).toBe('warning');
    expect(byField(items, 'abbreviationShown').status).toBe('warning');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, indexingClaimsAccurate: false };
    expect(byField(await run(bad, 'tr'), 'indexingClaimsAccurate').message).toContain('beyan edilmedi');
    expect(byField(await run(bad, 'tr'), 'indexingClaimsAccurate').message).toContain('(Genel Husus 13)');
    expect(byField(await run(bad, 'en'), 'indexingClaimsAccurate').message).toContain('was not declared');
  });
});
