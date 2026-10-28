import { describe, it, expect } from 'vitest';
import type { FormData } from '../src/types/formData';
import type { ReportResponse } from '../src/types/report';

describe('Types', () => {
  it('FormData has required fields', () => {
    const form: FormData = {
      openAccess: {
        adheresToDefinition: true,
        openAccessStatementUrl: 'https://example.com/oa',
        licenseStartDate: '2023-01',
      },
      about: {
        journalTitle: 'Test Journal',
        alternativeTitle: '',
        homepageUrl: 'https://example.com',
        issnPrint: '',
        issnOnline: '1234-5678',
        keywords: ['engineering'],
        languages: ['English'],
        publisherName: 'Test Publisher',
        publisherCountry: 'Turkey',
      },
      copyright: {
        licenses: ['CC BY'],
        licenseInfoUrl: 'https://example.com/license',
        embedsLicenseInArticles: false,
        authorsRetainCopyright: true,
        copyrightTermsUrl: 'https://example.com/copyright',
      },
      editorial: {
        peerReviewTypes: ['Double anonymous peer review'],
        peerReviewPolicyUrl: 'https://example.com/peer-review',
        screensPlagiarism: true,
        plagiarismPolicyUrl: 'https://example.com/plagiarism',
        aimsAndScopeUrl: 'https://example.com/aims',
        editorialBoardUrl: 'https://example.com/board',
        instructionsForAuthorsUrl: 'https://example.com/instructions',
        avgWeeksSubmissionToPublication: 12,
      },
      businessModel: {
        chargesApc: false,
        apcFees: [],
        apcInfoUrl: '',
        providesWaiver: false,
        chargesOtherFees: false,
      },
      bestPractice: {
        archivingServices: [],
        repositoryPolicies: [],
        persistentIdentifiers: ['DOIs'],
      },
    };
    expect(form.openAccess.adheresToDefinition).toBe(true);
    expect(form.about.issnOnline).toBe('1234-5678');
  });

  it('ReportResponse has issues array', () => {
    const report: ReportResponse = {
      overallStatus: 'fail',
      passCount: 3,
      failCount: 2,
      issues: [
        {
          section: 'Open Access',
          field: 'openAccessStatementUrl',
          status: 'fail',
          message: 'Open access statement not found on the page',
          suggestion: 'Add a clear open access statement to the linked page.',
          url: 'https://example.com/oa',
        },
      ],
    };
    expect(report.issues).toHaveLength(1);
  });
});
