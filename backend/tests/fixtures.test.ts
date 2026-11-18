import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseHtml } from '../src/scraper/pageScraper';
import { selectPassages } from '../src/scraper/passages';
import { extractPdfPages } from '../src/scraper/pdfText';
import { PAGE_TEXT_BUDGET } from '../src/ai/aiClient';
import { KEYWORDS } from '../src/validators/keywords';
import { HOMEPAGE_CHECKS } from '../src/validators/homepageChecks';
import { pdfExcerpt } from '../src/validators/sampleArticle';

interface FixtureCase {
  name: string;
  file: string;
  url: string;
  keywords: string;
  mustContain: string[];
}

const DIR = join(__dirname, 'fixtures', 'dergipark');
const cases = JSON.parse(readFileSync(join(DIR, 'cases.json'), 'utf8')) as FixtureCase[];

/** Section keyword lists plus the homepage ones, addressed as "homepage" + capitalised field prefix. */
function keywordsFor(name: string): string[] {
  if (name in KEYWORDS) return [...KEYWORDS[name as keyof typeof KEYWORDS]];
  const homepage: Record<string, string> = { homepageIssn: 'issnOnHomepage', homepageLanguage: 'publicationLanguageStated' };
  const check = HOMEPAGE_CHECKS.find((c) => c.field === homepage[name]);
  if (!check) throw new Error(`Unknown keyword list "${name}" in cases.json`);
  return check.keywords;
}

/** What the AI receives for this page: selected passages, or the PDF excerpt. */
async function aiText(c: FixtureCase): Promise<string> {
  const bytes = readFileSync(join(DIR, c.file));
  if (c.file.endsWith('.pdf')) return pdfExcerpt(await extractPdfPages(bytes)).text;
  const { text } = parseHtml(bytes.toString('utf8'), c.url);
  return selectPassages(text, keywordsFor(c.keywords), PAGE_TEXT_BUDGET).text;
}

describe('DergiPark regression fixtures', () => {
  it('has a readable case list', () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) expect(() => keywordsFor(c.keywords)).not.toThrow();
  });

  for (const c of cases) {
    it.skipIf(!existsSync(join(DIR, c.file)))(c.name, async () => {
      const text = await aiText(c);
      for (const phrase of c.mustContain) expect(text).toContain(phrase);
    });
  }
});
