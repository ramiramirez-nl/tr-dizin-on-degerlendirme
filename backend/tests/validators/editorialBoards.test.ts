import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/scraper/pageScraper', () => ({ scrapeUrl: vi.fn() }));
vi.mock('../../src/ai/aiClient', () => ({ analyzePageContent: vi.fn() }));

import { scrapeUrl } from '../../src/scraper/pageScraper';
import { analyzePageContent } from '../../src/ai/aiClient';

import { validateEditorialBoards } from '../../src/validators/editorialBoards';
import type { EditorialBoardsData } from '../../src/types/formData';

const scrape = scrapeUrl as unknown as ReturnType<typeof vi.fn>;
const ai = analyzePageContent as unknown as ReturnType<typeof vi.fn>;

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

beforeEach(() => {
  vi.resetAllMocks();
  scrape.mockResolvedValue({ accessible: true, text: 'page', links: [], statusCode: 200 });
  ai.mockResolvedValue({ found: true, confidence: 'high', evidence: 'ok', issues: [] });
});

const good: EditorialBoardsData = {
  editorialBoardUrl: 'https://example.com/board',
  boardOneThirdExternal: true,
  hasFieldEditors: true,
  hasLanguageEditors: true,
  hasAdvisoryBoard: true,
  boardCompetenceStated: true,
};
const run = (d: EditorialBoardsData, lang?: string) => validateEditorialBoards(d, lang) as Promise<Item[]>;

describe('validateEditorialBoards', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items).toHaveLength(6);
    expect(items.every((i) => i.status === 'pass' && i.section === 'Editorial Boards')).toBe(true);
  });

  it.each(['boardOneThirdExternal', 'hasLanguageEditors'] as const)('fails when %s is false', async (field) => {
    const items = await run({ ...good, [field]: false });
    expect(byField(items, field).status).toBe('fail');
  });

  it.each(['hasFieldEditors', 'hasAdvisoryBoard', 'boardCompetenceStated'] as const)('warns when %s is not declared', async (field) => {
    const items = await run({ ...good, [field]: undefined as unknown as boolean });
    expect(byField(items, field).status).toBe('warning');
  });

  it('fails when the board page is missing or lacks content, warns when AI is skipped', async () => {
    expect(byField(await run({ ...good, editorialBoardUrl: '' }), 'editorialBoardUrl').status).toBe('fail');
    ai.mockResolvedValue({ found: false, confidence: 'high', evidence: 'yok', issues: [] });
    expect(byField(await run(good), 'editorialBoardUrl').status).toBe('fail');
    ai.mockResolvedValue({ found: false, confidence: 'low', evidence: 's', issues: [], skipped: true });
    expect(byField(await run(good), 'editorialBoardUrl').status).toBe('warning');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, hasLanguageEditors: false };
    expect(byField(await run(bad, 'tr'), 'hasLanguageEditors').message).toContain('Dil editörlerinin');
    expect(byField(await run(bad, 'en'), 'hasLanguageEditors').message).toContain('language editors');
  });
});
