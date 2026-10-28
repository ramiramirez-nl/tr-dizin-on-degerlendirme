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

describe('validateArticleFormat', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items).toHaveLength(17);
    expect(items.every((i) => i.status === 'pass' && i.section === 'Article Format')).toBe(true);
  });

  it('runs a single combined AI criterion on the sample article', async () => {
    await run(good);
    expect(ai).toHaveBeenCalledTimes(1);
    const criteria = ai.mock.calls[0][0].criteria as string;
    for (const word of ['abstract', 'ORCID', 'Latin script', 'citation line']) {
      expect(criteria).toContain(word);
    }
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
