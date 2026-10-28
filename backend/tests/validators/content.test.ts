import { describe, it, expect } from 'vitest';
import { validateContent } from '../../src/validators/content';
import type { ContentData, ValidationContext } from '../../src/types/formData';

type Item = { field: string; status: string; message: string; suggestion: string; section: string };
const byField = (items: Item[], field: string) => items.find((i) => i.field === field) as Item;

const good: ContentData = {
  publishesOnTime: true,
  researchArticlesLastYear: 20,
  totalScientificArticlesLastYear: 30,
  articleCountsBalanced: true,
  authorInstitutionDiversity: true,
  combinedIssuesLast3Years: 0,
  specialIssuesLastYear: 0,
  specialIssuesSeparatePaging: false,
  onlyReviewOrCaseReportStated: false,
  metadataSubmissionMethod: 'dergipark',
};
const social: ValidationContext = { subjectArea: 'social_humanities', issuesPerYear: 3 };
const run = (d: ContentData, lang?: string, ctx: ValidationContext = social) =>
  validateContent(d, lang, ctx) as Promise<Item[]>;

describe('validateContent', () => {
  it('passes everything on the happy path', async () => {
    const items = await run(good, 'tr');
    expect(items.every((i) => i.status === 'pass' && i.section === 'Content')).toBe(true);
    expect(byField(items, 'researchArticleMinimum')).toBeUndefined();
  });

  it('fails when the journal does not publish on time', async () => {
    expect(byField(await run({ ...good, publishesOnTime: false }), 'publishesOnTime').status).toBe('fail');
  });

  it.each([
    [10, 20, 'pass'],
    [9, 20, 'fail'],
    [30, 30, 'pass'],
    [0, 10, 'fail'],
  ])('research ratio %i/%i is %s (50%% threshold)', async (research, total, expected) => {
    const items = await run({ ...good, researchArticlesLastYear: research, totalScientificArticlesLastYear: total });
    expect(byField(items, 'researchArticleRatio').status).toBe(expected);
  });

  it('includes the computed percentage in the message', async () => {
    const items = await run({ ...good, researchArticlesLastYear: 1, totalScientificArticlesLastYear: 3 }, 'en');
    expect(byField(items, 'researchArticleRatio').message).toContain('33.3%');
  });

  it('warns when there are no article counts and skips the ratio for review/case-report journals', async () => {
    const empty = await run({ ...good, totalScientificArticlesLastYear: 0, researchArticlesLastYear: 0 });
    expect(byField(empty, 'researchArticleRatio').status).toBe('warning');
    for (const subjectArea of ['review_only', 'case_report_only'] as const) {
      const items = await run({ ...good, researchArticlesLastYear: 0 }, 'tr', { subjectArea, issuesPerYear: 3 });
      expect(byField(items, 'researchArticleRatio').status).toBe('pass');
      expect(byField(items, 'researchArticleMinimum')).toBeUndefined();
    }
  });

  it('requires 12 research articles for health journals', async () => {
    const health: ValidationContext = { subjectArea: 'health', issuesPerYear: 3 };
    const ok = await run({ ...good, researchArticlesLastYear: 12, totalScientificArticlesLastYear: 20 }, 'tr', health);
    expect(byField(ok, 'researchArticleMinimum').status).toBe('pass');
    const low = await run({ ...good, researchArticlesLastYear: 11, totalScientificArticlesLastYear: 20 }, 'tr', health);
    expect(byField(low, 'researchArticleMinimum').status).toBe('fail');
  });

  it('warns on the soft declarations', async () => {
    const items = await run({ ...good, articleCountsBalanced: false, authorInstitutionDiversity: undefined as unknown as boolean });
    expect(byField(items, 'articleCountsBalanced').status).toBe('warning');
    expect(byField(items, 'authorInstitutionDiversity').status).toBe('warning');
  });

  it.each([
    [0, 'pass'],
    [1, 'pass'],
    [2, 'fail'],
  ])('%i combined issues in 3 years is %s', async (combined, expected) => {
    expect(byField(await run({ ...good, combinedIssuesLast3Years: combined }), 'combinedIssuesLast3Years').status).toBe(expected);
  });

  it.each([
    [3, 1, 'pass'], // 1 <= 3/3
    [3, 2, 'fail'],
    [6, 2, 'pass'],
    [6, 3, 'fail'],
    [2, 1, 'fail'], // 1 > 2/3
    [4, 1, 'pass'], // 1 <= 4/3
    [4, 0, 'pass'],
  ])('with %i issues per year, %i special issue(s) is %s (K 18.3)', async (issuesPerYear, special, expected) => {
    const items = await run(
      { ...good, specialIssuesLastYear: special, specialIssuesSeparatePaging: true },
      'tr',
      { subjectArea: 'social_humanities', issuesPerYear }
    );
    expect(byField(items, 'specialIssuesLastYear').status).toBe(expected);
  });

  it('requires separate paging only when special issues exist', async () => {
    const none = await run({ ...good, specialIssuesLastYear: 0, specialIssuesSeparatePaging: false });
    expect(byField(none, 'specialIssuesSeparatePaging').status).toBe('pass');
    const missing = await run({ ...good, specialIssuesLastYear: 1, specialIssuesSeparatePaging: false });
    expect(byField(missing, 'specialIssuesSeparatePaging').status).toBe('fail');
    const ok = await run({ ...good, specialIssuesLastYear: 1, specialIssuesSeparatePaging: true });
    expect(byField(ok, 'specialIssuesSeparatePaging').status).toBe('pass');
  });

  it('requires the review/case-report statement only for those journal types', async () => {
    const regular = await run({ ...good, onlyReviewOrCaseReportStated: false });
    expect(byField(regular, 'onlyReviewOrCaseReportStated').status).toBe('pass');
    const review: ValidationContext = { subjectArea: 'review_only', issuesPerYear: 3 };
    expect(byField(await run({ ...good, onlyReviewOrCaseReportStated: false }, 'tr', review), 'onlyReviewOrCaseReportStated').status).toBe('fail');
    expect(byField(await run({ ...good, onlyReviewOrCaseReportStated: true }, 'tr', review), 'onlyReviewOrCaseReportStated').status).toBe('pass');
  });

  it('warns when no metadata route is chosen and describes the chosen one', async () => {
    expect(byField(await run({ ...good, metadataSubmissionMethod: '' }), 'metadataSubmissionMethod').status).toBe('warning');
    const xml = byField(await run({ ...good, metadataSubmissionMethod: 'trdizin_xml' }, 'en'), 'metadataSubmissionMethod');
    expect(xml.status).toBe('pass');
    expect(xml.message).toContain('XML');
  });

  it('uses Turkish for tr and English for en', async () => {
    const bad = { ...good, publishesOnTime: false };
    expect(byField(await run(bad, 'tr'), 'publishesOnTime').message).toContain('zamanında');
    expect(byField(await run(bad, 'tr'), 'publishesOnTime').message).toContain('(K 1)');
    expect(byField(await run(bad, 'en'), 'publishesOnTime').message).toContain('on schedule');
  });
});
