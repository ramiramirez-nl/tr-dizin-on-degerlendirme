import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { analyzePageContent } from '../../src/ai/aiClient';

import { validatePeerReview } from '../../src/validators/peerReview';
import type { PeerReviewData } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'page', links: [], statusCode: 200 });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

const good: PeerReviewData = {
  peerReviewPolicyUrl: 'https://example.com/review',
  minTwoReviewers: true,
  reviewersFromDifferentInstitutions: true,
  thirdReviewerOnDisagreement: true,
  reportsKeptFiveYears: true,
  reportsShowScientificEvaluation: true,
  canUploadReviewReportsPdf: true,
  screensPlagiarism: true,
  plagiarismPolicyUrl: 'https://example.com/plagiarism',
  publishesReviewerList: true,
};
const run = (d: PeerReviewData, lang?: string) => validatePeerReview(d, lang) as Promise<Item[]>;

describe('validatePeerReview', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items).toHaveLength(10);
    expect(items.every((i) => i.status === 'pass' && i.section === 'Peer Review')).toBe(true);
  });

  it.each([
    'minTwoReviewers',
    'reviewersFromDifferentInstitutions',
    'reportsKeptFiveYears',
    'reportsShowScientificEvaluation',
  ] as const)('fails when %s is false', async (field) => {
    expect(byField(await run({ ...good, [field]: false }), field).status).toBe('fail');
  });

  it.each(['thirdReviewerOnDisagreement', 'canUploadReviewReportsPdf', 'screensPlagiarism', 'publishesReviewerList'] as const)(
    'warns when %s is not declared',
    async (field) => {
      const items = await run({ ...good, [field]: undefined as unknown as boolean });
      expect(byField(items, field).status).toBe('warning');
    }
  );

  it('only checks the plagiarism policy URL when plagiarism screening is declared', async () => {
    const without = await run({ ...good, screensPlagiarism: false });
    expect(byField(without, 'plagiarismPolicyUrl')).toBeUndefined();
    const noUrl = await run({ ...good, plagiarismPolicyUrl: '' });
    expect(byField(noUrl, 'plagiarismPolicyUrl')).toBeUndefined();
  });

  it('checks the plagiarism page separately from the review policy page', async () => {
    ai.mockImplementation(async ({ url }: { url: string }) => ({
      found: !url.includes('plagiarism'),
      confidence: 'high',
      evidence: 'x',
      issues: [],
    }));
    const items = await run(good);
    expect(byField(items, 'plagiarismPolicyUrl').status).toBe('fail');
    expect(byField(items, 'peerReviewPolicyUrl').status).toBe('pass');
  });

  it('fails the policy page when no URL is provided and warns when AI is skipped', async () => {
    expect(byField(await run({ ...good, peerReviewPolicyUrl: '' }), 'peerReviewPolicyUrl').status).toBe('fail');
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 's', issues: [], skipped: true });
    expect(byField(await run(good), 'peerReviewPolicyUrl').status).toBe('warning');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, reportsKeptFiveYears: false };
    expect(byField(await run(bad, 'tr'), 'reportsKeptFiveYears').message).toContain('beş yıl');
    expect(byField(await run(bad, 'tr'), 'reportsKeptFiveYears').message).toContain('(GH 4)');
    expect(byField(await run(bad, 'en'), 'reportsKeptFiveYears').message).toContain('five years');
  });
});
