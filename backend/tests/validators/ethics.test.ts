import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { analyzePageContent } from '../../src/ai/aiClient';
import { validateEthics } from '../../src/validators/ethics';
import type { EthicsData, ValidationContext } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'page', links: [], statusCode: 200 });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

const good: EthicsData = {
  ethicsPolicyUrl: 'https://example.com/ethics',
  separateSectionsForRoles: true,
  referencesCopeOrIcmje: true,
  statesResearchPublicationEthicsCompliance: true,
  requiresEthicsCommitteeApproval: true,
  requiresInformedConsentForCaseReports: true,
  requiresDeclarationsAtArticleEnd: true,
  respectsCopyrightForWorksUsed: true,
};
const social: ValidationContext = { subjectArea: 'social_humanities', issuesPerYear: 2 };
const run = (d: EthicsData, lang?: string, ctx: ValidationContext = social) =>
  validateEthics(d, lang, ctx) as Promise<Item[]>;

describe('validateEthics', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items).toHaveLength(8);
    expect(items.every((i) => i.status === 'pass' && i.section === 'Ethics')).toBe(true);
  });

  it.each([
    'separateSectionsForRoles',
    'referencesCopeOrIcmje',
    'statesResearchPublicationEthicsCompliance',
    'requiresEthicsCommitteeApproval',
    'requiresDeclarationsAtArticleEnd',
  ] as const)('fails when %s is false', async (field) => {
    expect(byField(await run({ ...good, [field]: false }), field).status).toBe('fail');
  });

  it('warns when copyright handling is not declared', async () => {
    const items = await run({ ...good, respectsCopyrightForWorksUsed: undefined as unknown as boolean });
    expect(byField(items, 'respectsCopyrightForWorksUsed').status).toBe('warning');
  });

  it.each([
    ['health', 'fail'],
    ['case_report_only', 'fail'],
    ['social_humanities', 'warning'],
    ['engineering_science_vet', 'warning'],
    ['', 'warning'],
  ] as const)('informed consent severity for %s is %s', async (subjectArea, expected) => {
    const items = await run({ ...good, requiresInformedConsentForCaseReports: false }, 'tr', { subjectArea, issuesPerYear: 3 });
    expect(byField(items, 'requiresInformedConsentForCaseReports').status).toBe(expected);
  });

  it('fails a missing ethics page and warns when AI is skipped', async () => {
    expect(byField(await run({ ...good, ethicsPolicyUrl: '' }), 'ethicsPolicyUrl').status).toBe('fail');
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 's', issues: [], skipped: true });
    expect(byField(await run(good), 'ethicsPolicyUrl').status).toBe('warning');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, referencesCopeOrIcmje: false };
    expect(byField(await run(bad, 'tr'), 'referencesCopeOrIcmje').message).toContain('COPE');
    expect(byField(await run(bad, 'tr'), 'referencesCopeOrIcmje').message).toContain('beyan edilmedi');
    expect(byField(await run(bad, 'en'), 'referencesCopeOrIcmje').message).toContain('was not declared');
  });
});
