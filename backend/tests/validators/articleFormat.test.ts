import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { analyzePageContent } from '../../src/ai/aiClient';
import { validateArticleFormat } from '../../src/validators/articleFormat';
import type { ArticleFormatData } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'page', links: [], statusCode: 200 });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

const good: ArticleFormatData = {
  sampleArticleUrl: 'https://example.com/article',
  abstractAndKeywordsInArticleLanguage: true,
  abstractWordLimitStated: true,
  publishesNonLatinScript: false,
  latinScriptForNonLatin: false,
  articleTypeOnTocAndFirstPage: true,
  datesSubmissionAcceptanceShown: true,
  affiliationsAndOrcidShown: true,
  noAdsInsideArticles: true,
  referenceStyle: 'APA',
  referencesLatinScript: true,
  footnoteReferencesListed: true,
  citationLineOnFirstPage: true,
  issueCoverHasNameYearVolumeIssue: true,
  pageNumberingContinuous: true,
  pdfTextCopyable: true,
  bilingualTitleAbstractKeywords: true,
  bilingualTocTitles: true,
};
const run = (d: ArticleFormatData, lang?: string) => validateArticleFormat(d, lang) as Promise<Item[]>;

const articlePdf = {
  accessible: true,
  text: 'pdf',
  links: [],
  statusCode: 200,
  pdfPages: [
    'Araştırma Makalesi\nGeliş: 01.01.2025 Kabul: 02.02.2025\nÖz: ' + 'Bu çalışma '.repeat(30) + '\nAnahtar Kelimeler: a, b\nAtıf: Dergi, 2025, 10(1), 1-20',
    'Gövde metni '.repeat(40),
    'Çıkar Çatışması: Yoktur. Katkı oranı: %100.\nKaynakça\nSmith, J. (2020). Başlık.',
  ],
};

describe('validateArticleFormat', () => {
  it('passes everything on the happy path with a PDF sample article', async () => {
    scrape.mockResolvedValue(articlePdf);
    const items = await run(good, 'tr');
    expect(items).toHaveLength(18);
    expect(items.every((i) => i.status === 'pass' && i.section === 'Article Format')).toBe(true);
  });

  it('checks the PDF first page, the article end and the references with two AI criteria', async () => {
    scrape.mockResolvedValue(articlePdf);
    await run(good);
    expect(ai).toHaveBeenCalledTimes(2);
    const calls = ai.mock.calls.map((c) => c[0]);
    const main = calls.find((c) => (c.criteria as string).includes('citation line on page 1'));
    expect(main).toBeDefined();
    expect(main.pageText).toContain('İLK SAYFALAR');
    expect(main.budget).toBeGreaterThan(4000);
    expect(main.pageText).toContain('KAYNAKÇA BAŞLANGICI');
    expect(main.pageText).toContain('Çıkar Çatışması');
    expect(calls.some((c) => (c.criteria as string).includes('conflict of interest'))).toBe(true);
  });

  it('treats a readable PDF as evidence that its text can be copied, and quotes a line', async () => {
    scrape.mockResolvedValue(articlePdf);
    const items = await run({ ...good, pdfTextCopyable: undefined as unknown as boolean });
    const item = byField(items, 'pdfTextCopyable') as Item & { evidence?: string };
    expect(item.status).toBe('pass');
    expect(item.evidence).toContain('Geliş: 01.01.2025');
  });

  it('warns instead of failing when front-matter lines had to be left out of the PDF excerpt', async () => {
    const crowded = Array.from({ length: 120 }, (_v, i) => `Abstract satırı ${i}: keywords, received, accepted, ORCID ve üniversite bilgileri burada uzun uzun anlatılır.`).join('\n');
    scrape.mockResolvedValue({ ...articlePdf, pdfPages: [crowded, crowded, crowded, 'Kaynakça\nSmith (2020).'] });
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: '', issues: ['anahtar kelimeler'] });
    const item = byField(await run(good), 'sampleArticleUrl');
    expect(item.status).toBe('warning');
  });

  it('fails the copyable-text rule for a scanned PDF without a text layer', async () => {
    scrape.mockResolvedValue({ ...articlePdf, pdfPages: ['', ''] });
    const items = await run(good);
    expect(byField(items, 'pdfTextCopyable').status).toBe('fail');
    expect(byField(items, 'sampleArticleUrl').status).toBe('warning');
    expect(ai).not.toHaveBeenCalled();
  });

  it('downgrades missing end-of-article declarations to a warning', async () => {
    scrape.mockResolvedValue(articlePdf);
    ai.mockImplementation(async (input: { criteria: string }) =>
      input.criteria.includes('conflict of interest')
        ? { found: false, confidence: 'medium', evidence: '', issues: [] }
        : { found: true, confidence: 'high', evidence: '', issues: [] }
    );
    expect(byField(await run(good), 'sampleArticleDeclarations').status).toBe('warning');
  });

  it('accepts an HTML article page and warns that PDF-only rules were not verified', async () => {
    const items = await run(good);
    expect(ai).toHaveBeenCalledTimes(1);
    const criteria = ai.mock.calls[0][0].criteria as string;
    for (const word of ['abstract', 'ORCID', 'Latin script']) {
      expect(criteria).toContain(word);
    }
    expect(criteria).not.toContain('citation line');
    expect(byField(items, 'sampleArticlePdf').status).toBe('warning');
    expect(byField(items, 'pdfTextCopyable').status).toBe('pass');
  });

  it.each([
    'abstractAndKeywordsInArticleLanguage',
    'abstractWordLimitStated',
    'articleTypeOnTocAndFirstPage',
    'datesSubmissionAcceptanceShown',
    'affiliationsAndOrcidShown',
    'noAdsInsideArticles',
    'referencesLatinScript',
    'issueCoverHasNameYearVolumeIssue',
    'pageNumberingContinuous',
    'pdfTextCopyable',
  ] as const)('fails when %s is false', async (field) => {
    expect(byField(await run({ ...good, [field]: false }), field).status).toBe('fail');
  });

  it.each(['footnoteReferencesListed', 'citationLineOnFirstPage', 'bilingualTitleAbstractKeywords', 'bilingualTocTitles'] as const)(
    'warns when %s is false',
    async (field) => {
      expect(byField(await run({ ...good, [field]: false }), field).status).toBe('warning');
    }
  );

  it('evaluates latinScriptForNonLatin only for non-Latin publishers', async () => {
    const na = byField(await run({ ...good, publishesNonLatinScript: false, latinScriptForNonLatin: false }), 'latinScriptForNonLatin');
    expect(na.status).toBe('pass');
    const fail = await run({ ...good, publishesNonLatinScript: true, latinScriptForNonLatin: false });
    expect(byField(fail, 'latinScriptForNonLatin').status).toBe('fail');
    const ok = await run({ ...good, publishesNonLatinScript: true, latinScriptForNonLatin: true });
    expect(byField(ok, 'latinScriptForNonLatin').status).toBe('pass');
  });

  it('fails an empty reference style', async () => {
    expect(byField(await run({ ...good, referenceStyle: 'ISNAD' }), 'referenceStyle').status).toBe('pass');
    expect(byField(await run({ ...good, referenceStyle: '' }), 'referenceStyle').status).toBe('fail');
    expect(byField(await run({ ...good, referenceStyle: '  ' }), 'referenceStyle').status).toBe('fail');
  });

  it('fails a missing sample article and warns when AI is skipped', async () => {
    expect(byField(await run({ ...good, sampleArticleUrl: '' }), 'sampleArticleUrl').status).toBe('fail');
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 's', issues: [], skipped: true });
    expect(byField(await run(good), 'sampleArticleUrl').status).toBe('warning');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, pdfTextCopyable: false };
    expect(byField(await run(bad, 'tr'), 'pdfTextCopyable').message).toContain('kopyalanabilir');
    expect(byField(await run(bad, 'en'), 'pdfTextCopyable').message).toContain('can be copied');
  });
});
