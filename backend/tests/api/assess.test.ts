import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

const mockReport = {
  overallStatus: 'fail',
  passCount: 5,
  failCount: 2,
  issues: [
    {
      section: 'Identity',
      field: 'homepageUrl',
      status: 'fail',
      message: 'Page not accessible',
      suggestion: 'Fix the URL',
    },
  ],
};

vi.mock('../../src/validators/index', () => ({
  SECTION_NAMES: [
    'Identity',
    'Website',
    'Editorial Boards',
    'Peer Review',
    'Article Format',
    'Ethics',
    'Content',
  ],
  runAllValidations: vi
    .fn()
    .mockImplementation(
      async (
        _formData: unknown,
        _language: unknown,
        onSection?: (r: { section: string; index: number; items: unknown[] }) => void
      ) => {
        onSection?.({ section: 'Identity', index: 0, items: [] });
        return mockReport;
      }
    ),
}));

import app from '../../src/index';

describe('POST /api/assess', () => {
  it('returns 200 with report on valid form data', async () => {
    const formData = {
      identity: {
        journalTitle: 'Test Dergisi',
        homepageUrl: 'https://example.com',
        issnPrint: '',
        issnOnline: '1234-5678',
        subjectArea: 'social_humanities',
        issuesPerYear: 2,
        publishedIssueCount: 4,
        publicationLanguages: ['Türkçe'],
      },
      website: {
        aimsAndScopeUrl: 'https://example.com/aims',
        authorGuidelinesUrl: 'https://example.com/guidelines',
        publicationPolicyUrl: 'https://example.com/policy',
        journalInfoComplete: true,
        nameChanged: false,
        hasJournalHistory: false,
        indexingClaimsAccurate: true,
        abbreviationShown: true,
      },
      peerReview: {
        peerReviewPolicyUrl: 'https://example.com/review',
        minTwoReviewers: true,
        reviewersFromDifferentInstitutions: true,
        screensPlagiarism: false,
      },
      editorialBoards: {
        editorialBoardUrl: 'https://example.com/board',
        boardOneThirdExternal: true,
      },
    };

    const res = await request(app).post('/api/assess').send(formData);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('overallStatus');
    expect(res.body).toHaveProperty('issues');
    expect(Array.isArray(res.body.issues)).toBe(true);
  });

  it('returns 400 on missing form data', async () => {
    const res = await request(app).post('/api/assess').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('identity, website, peerReview');
  });

  it('streams start, section, and done events when Accept is text/event-stream', async () => {
    const formData = {
      identity: {
        journalTitle: 'Test Dergisi',
        homepageUrl: 'https://example.com',
        issnOnline: '1234-5678',
      },
      website: {
        aimsAndScopeUrl: 'https://example.com/aims',
      },
      peerReview: {
        peerReviewPolicyUrl: 'https://example.com/review',
      },
    };

    const res = await request(app)
      .post('/api/assess')
      .set('Accept', 'text/event-stream')
      .send(formData)
      .buffer(true)
      .parse((response, callback) => {
        let data = '';
        response.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        response.on('end', () => callback(null, data));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    const body = res.body as string;
    expect(body).toContain('event: start');
    expect(body).toContain('event: section');
    expect(body).toContain('event: done');
    expect(body).toContain('"overallStatus":"fail"');
  });
});
