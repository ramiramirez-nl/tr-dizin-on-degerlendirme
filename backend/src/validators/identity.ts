import { scrapeUrl } from '../scraper/pageScraper';
import type { ScrapeResult } from '../scraper/pageScraper';
import { lookupIssn } from '../issn/issnClient';
import { analyzePageContent } from '../ai/aiClient';
import type { IdentityData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { describeAccessFailure, pick, withRef } from './shared';
import type { Bilingual } from './shared';

const SECTION = 'Identity';

/** Minimum issues per year by subject area (ÖK 2). */
const MIN_ISSUES: Record<string, number> = {
  health: 3,
  engineering_science_vet: 2,
  social_humanities: 1,
  review_only: 1,
  case_report_only: 1,
};

interface HomepageCheck {
  field: string;
  criteria: string;
  pass: Bilingual;
  fail: Bilingual;
  suggestion: Bilingual;
  unverified: Bilingual;
  /** Criterion reference appended to this check's messages, e.g. `ÖK 6`. */
  ref: string;
}

const HOMEPAGE_CHECKS: HomepageCheck[] = [
  {
    field: 'issnOnHomepage',
    ref: 'ÖK 6',
    criteria:
      'Is an ISSN and/or e-ISSN number visibly displayed on this page (for example "ISSN: 1234-5678" or "e-ISSN: 1234-5678" in the header, footer or journal information box)? The page may be in Turkish or English.',
    pass: {
      tr: 'ISSN ve/veya e-ISSN numarası dergi ana sayfasında görünür biçimde yer alıyor. (ÖK 6)',
      en: 'The ISSN and/or e-ISSN is visibly displayed on the journal homepage. (ÖK 6)',
    },
    fail: {
      tr: 'ISSN veya e-ISSN numarası dergi ana sayfasında görünür biçimde bulunamadı. (ÖK 6)',
      en: 'No visible ISSN or e-ISSN was found on the journal homepage. (ÖK 6)',
    },
    suggestion: {
      tr: 'Dergi ana sayfasında (başlık, alt bilgi veya dergi bilgi kutusunda) ISSN ve/veya e-ISSN numarasını açıkça gösterin.',
      en: 'Display the ISSN and/or e-ISSN clearly on the homepage (header, footer or journal information box).',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için ISSN numarasının sayfada görüntülendiği doğrulanamadı. (ÖK 6)',
      en: 'The homepage could not be reached, so the visibility of the ISSN could not be verified. (ÖK 6)',
    },
  },
  {
    field: 'peerReviewedStatement',
    ref: 'ÖK 7',
    criteria:
      'Does the page state that the journal is a peer-reviewed (hakemli) scientific journal, for example "hakemli bilimsel dergi", "çift kör hakemlik" or "peer-reviewed scholarly journal"? The page may be in Turkish or English.',
    pass: {
      tr: 'Ana sayfada derginin hakemli bir bilimsel dergi olduğu belirtiliyor. (ÖK 7)',
      en: 'The homepage states that the journal is a peer-reviewed scientific journal. (ÖK 7)',
    },
    fail: {
      tr: 'Ana sayfada derginin hakemli bir bilimsel dergi olduğuna dair bir ifade bulunamadı. (ÖK 7)',
      en: 'No statement that the journal is peer-reviewed and scientific was found on the homepage. (ÖK 7)',
    },
    suggestion: {
      tr: 'Ana sayfada derginin hakemli (bilimsel hakem sistemiyle yayımlanan) bir bilimsel dergi olduğunu açıkça belirtin.',
      en: 'State clearly on the homepage that the journal is a peer-reviewed scientific journal.',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için hakemli dergi ifadesi doğrulanamadı. (ÖK 7)',
      en: 'The homepage could not be reached, so the peer-review statement could not be verified. (ÖK 7)',
    },
  },
  {
    field: 'publicationLanguageStated',
    ref: 'ÖK 8',
    criteria:
      'Does the page state the journal\'s publication language(s), meaning the language(s) in which articles are published (for example "Yayın dili: Türkçe, İngilizce", "Yayın Dili", "Dil: Türkçe", "Languages: Turkish, English" or "Publication language: English")? A website interface language switcher (such as TR/EN buttons) or an html lang attribute alone does NOT count. The page may be in Turkish or English.',
    pass: {
      tr: 'Derginin yayın dili/dilleri ana sayfada belirtiliyor. (ÖK 8)',
      en: "The journal's publication language(s) are stated on the homepage. (ÖK 8)",
    },
    fail: {
      tr: 'Derginin yayın dili/dilleri ana sayfada belirtilmiyor. (ÖK 8)',
      en: "The journal's publication language(s) are not stated on the homepage. (ÖK 8)",
    },
    suggestion: {
      tr: 'Dergi ana sayfasında yayın dilini veya dillerini açıkça belirtin.',
      en: 'State the publication language(s) clearly on the journal homepage.',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için yayın dilinin belirtildiği doğrulanamadı. (ÖK 8)',
      en: 'The homepage could not be reached, so the stated publication language could not be verified. (ÖK 8)',
    },
  },
];

async function homepageItems(url: string, language?: string): Promise<ReportItem[]> {
  const field = 'homepageUrl';
  if (!url) {
    return [
      {
        section: SECTION,
        field,
        status: 'fail',
        message: pick(language, {
          tr: 'Dergi ana sayfasının URL’si girilmedi. (ÖK 6)',
          en: 'No journal homepage URL provided. (ÖK 6)',
        }),
        suggestion: pick(language, {
          tr: 'Derginin ana sayfasına giden doğrudan bağlantıyı girin.',
          en: 'Provide the direct URL to the journal homepage.',
        }),
      },
      ...unverifiedItems(language),
    ];
  }
  const scraped: ScrapeResult = await scrapeUrl(url);
  if (!scraped.accessible) {
    const failure = describeAccessFailure(url, scraped, language, 'ÖK 6');
    return [
      {
        section: SECTION,
        field,
        status: scraped.errorType === 'timeout' ? 'warning' : 'fail',
        message: failure.message,
        suggestion: failure.suggestion,
        url,
      },
      ...unverifiedItems(language),
    ];
  }
  const accessible: ReportItem = {
    section: SECTION,
    field,
    status: 'pass',
    message: pick(language, {
      tr: 'Dergi ana sayfasına erişilebiliyor. (ÖK 6)',
      en: 'Journal homepage is accessible. (ÖK 6)',
    }),
    suggestion: '',
    url,
  };
  const aiItems = await Promise.all(
    HOMEPAGE_CHECKS.map(async (check): Promise<ReportItem> => {
      const analysis = await analyzePageContent({
        pageText: scraped.text,
        pageMeta: scraped.meta,
        criteria: check.criteria,
        url,
        language,
      });
      if (analysis.found) {
        return {
          section: SECTION,
          field: check.field,
          status: 'pass',
          message: pick(language, check.pass),
          suggestion: '',
          url,
          confidence: analysis.confidence,
          evidence: analysis.evidence,
        };
      }
      if (analysis.skipped) {
        return {
          section: SECTION,
          field: check.field,
          status: 'warning',
          message: withRef(
            pick(language, {
              tr: `Sayfa erişilebilir, ancak içeriğin yapay zeka ile doğrulanması çalıştırılamadı. ${analysis.evidence}`,
              en: `The page is accessible, but AI verification of its content could not run. ${analysis.evidence}`,
            }),
            check.ref,
            language
          ),
          suggestion: pick(language, {
            tr: `Sayfa içeriğini elle doğrulayın. ${check.suggestion.tr}`,
            en: `Verify the page content manually. ${check.suggestion.en}`,
          }),
          url,
        };
      }
      return {
        section: SECTION,
        field: check.field,
        status: 'fail',
        message: pick(language, check.fail),
        suggestion: pick(language, check.suggestion),
        url,
        confidence: analysis.confidence,
        evidence: analysis.evidence,
      };
    })
  );
  return [accessible, ...aiItems];
}

function unverifiedItems(language?: string): ReportItem[] {
  return HOMEPAGE_CHECKS.map((check) => ({
    section: SECTION,
    field: check.field,
    status: 'warning',
    message: pick(language, check.unverified),
    suggestion: pick(language, check.suggestion),
  }));
}

async function issnItems(data: IdentityData, language?: string): Promise<ReportItem[]> {
  const issnToCheck = data.issnOnline || data.issnPrint;
  if (!issnToCheck) {
    return [
      {
        section: SECTION,
        field: 'issnOnline',
        status: 'fail',
        message: pick(language, {
          tr: 'ISSN veya e-ISSN girilmedi. (ÖK 4)',
          en: 'No ISSN provided. (ÖK 4)',
        }),
        suggestion: pick(language, {
          tr: 'Derginin en az bir ISSN’i (basılı veya elektronik) bulunmalıdır. ISSN, T.C. Kültür ve Turizm Bakanlığı ISSN Ofisi’nden alınmış olmalıdır.',
          en: 'The journal must have at least one ISSN (print or online). The ISSN must be obtained from the ISSN Office of the Turkish Ministry of Culture and Tourism.',
        }),
      },
    ];
  }
  const field = data.issnOnline ? 'issnOnline' : 'issnPrint';
  const lookup = await lookupIssn(issnToCheck);
  const items: ReportItem[] = [
    {
      section: SECTION,
      field,
      status: lookup.valid ? 'pass' : lookup.lookupFailed ? 'warning' : 'fail',
      message: lookup.valid
        ? pick(language, {
            tr: `${issnToCheck} numaralı ISSN, issn.org kaydında “${lookup.registeredTitle}” adıyla görünüyor. (ÖK 4)`,
            en: `ISSN ${issnToCheck} is registered at issn.org as "${lookup.registeredTitle}". (ÖK 4)`,
          })
        : lookup.lookupFailed
          ? pick(language, {
              tr: `${issnToCheck} numaralı ISSN doğrulanamadı: issn.org yanıt vermedi. Bu, ISSN’in geçersiz olduğu anlamına gelmez. (ÖK 4)`,
              en: `ISSN ${issnToCheck} could not be verified: issn.org did not respond. This does not mean the ISSN is invalid. (ÖK 4)`,
            })
          : pick(language, {
              tr: `${issnToCheck} numaralı ISSN issn.org kaydında doğrulanamadı. (ÖK 4)`,
              en: `ISSN ${issnToCheck} is not confirmed at issn.org. (ÖK 4)`,
            }),
      suggestion: lookup.valid
        ? ''
        : lookup.lookupFailed
          ? pick(language, {
              tr: 'Değerlendirmeyi daha sonra yeniden çalıştırın veya ISSN’i https://portal.issn.org adresinden elle kontrol edin.',
              en: 'Re-run the assessment later, or check the ISSN manually at https://portal.issn.org.',
            })
          : pick(language, {
              tr: 'ISSN, T.C. Kültür ve Turizm Bakanlığı ISSN Ofisi’nden alınmış ve issn.org’da kayıtlı olmalıdır (ÖK 4). Derginin kapakta ve web sitesinde kullanılan adı ISSN kaydındaki adla aynı olmalıdır (ÖK 5).',
              en: 'The ISSN must be obtained from the ISSN Office of the Turkish Ministry of Culture and Tourism and be registered at issn.org (ÖK 4). The journal name on the cover and website must match the ISSN record (ÖK 5).',
            }),
    },
  ];
  // issn.org often appends qualifiers such as "(Online)", so compare the
  // normalised titles in both directions.
  const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const registered = normalize(lookup.registeredTitle ?? '');
  const provided = normalize(data.journalTitle ?? '');
  const match =
    registered.length > 0 &&
    provided.length > 0 &&
    (registered.includes(provided) || provided.includes(registered));
  if (lookup.valid && lookup.registeredTitle && !match) {
    items.push({
      section: SECTION,
      field: 'journalTitle',
      status: 'warning',
      message: pick(language, {
        tr: `Girilen dergi adı “${data.journalTitle}”, ISSN kaydındaki “${lookup.registeredTitle}” adıyla uyuşmuyor olabilir. (ÖK 5)`,
        en: `Journal title "${data.journalTitle}" may not match the ISSN-registered title "${lookup.registeredTitle}". (ÖK 5)`,
      }),
      suggestion: pick(language, {
        tr: 'Derginin kapağında, web sitesinde ve başvuruda kullanılan ad ISSN kaydındaki adla aynı olmalıdır.',
        en: 'The journal name on the cover, on the website and in the application must match the ISSN record.',
      }),
    });
  }
  return items;
}

function metadataItems(
  data: IdentityData,
  language: string | undefined,
  context?: ValidationContext
): ReportItem[] {
  const items: ReportItem[] = [];
  const hasLanguages = data.publicationLanguages.length > 0;
  items.push({
    section: SECTION,
    field: 'publicationLanguages',
    status: hasLanguages ? 'pass' : 'fail',
    message: hasLanguages
      ? pick(language, {
          tr: `Yayın dili belirtildi: ${data.publicationLanguages.join(', ')}. (ÖK 8)`,
          en: `Publication language(s) provided: ${data.publicationLanguages.join(', ')}. (ÖK 8)`,
        })
      : pick(language, {
          tr: 'Dergi yayın dili belirtilmedi. (ÖK 8)',
          en: 'No publication language provided. (ÖK 8)',
        }),
    suggestion: hasLanguages
      ? ''
      : pick(language, {
          tr: 'Derginin yayın dilini veya dillerini ekleyin.',
          en: 'Add the journal’s publication language(s).',
        }),
  });

  const area = context?.subjectArea ?? data.subjectArea;
  const min = area ? MIN_ISSUES[area] : undefined;
  if (min === undefined) {
    items.push({
      section: SECTION,
      field: 'issuesPerYear',
      status: 'warning',
      message: pick(language, {
        tr: 'Yıllık sayı sayısı için gereken asgari değer bilinmiyor çünkü bilim alanı seçilmedi. (ÖK 2)',
        en: 'The minimum number of issues per year cannot be determined because no subject area was chosen. (ÖK 2)',
      }),
      suggestion: pick(language, {
        tr: 'Derginin kapsadığı bilim alanını seçin.',
        en: 'Choose the journal’s subject area.',
      }),
    });
  } else {
    const issues = context?.issuesPerYear ?? data.issuesPerYear;
    const ok = issues >= min;
    items.push({
      section: SECTION,
      field: 'issuesPerYear',
      status: ok ? 'pass' : 'fail',
      message: ok
        ? pick(language, {
            tr: `Yılda ${issues} sayı yayımlanıyor; bu alan için asgari ${min} sayı gerekir. (ÖK 2)`,
            en: `${issues} issue(s) per year meets the minimum of ${min} for this subject area. (ÖK 2)`,
          })
        : pick(language, {
            tr: `Yılda ${issues} sayı yayımlanıyor; bu alan için asgari ${min} sayı gerekir. (ÖK 2)`,
            en: `${issues} issue(s) per year is below the minimum of ${min} for this subject area. (ÖK 2)`,
          }),
      suggestion: ok
        ? ''
        : pick(language, {
            tr: `TR Dizin; Sağlık Bilimleri için yılda en az 3, Mühendislik/Temel Bilimler/Veterinerlik için en az 2, Sosyal ve Beşeri Bilimler ile derleme/olgu sunumu dergileri için en az 1 sayı şartı arar. Yayın sıklığını bu düzeye çıkarın.`,
            en: 'TR Dizin requires at least 3 issues per year for health sciences, 2 for engineering/basic sciences/veterinary, and 1 for social sciences and humanities as well as review or case-report journals.',
          }),
    });
  }

  const published = data.publishedIssueCount >= 1;
  items.push({
    section: SECTION,
    field: 'publishedIssueCount',
    status: published ? 'pass' : 'fail',
    message: published
      ? pick(language, {
          tr: `Dergi bugüne kadar ${data.publishedIssueCount} sayı yayımlamış. (ÖK 1)`,
          en: `The journal has published ${data.publishedIssueCount} issue(s). (ÖK 1)`,
        })
      : pick(language, {
          tr: 'Yayımlanmış sayı bulunmuyor; başvuru için en az bir sayının yayımlanmış olması gerekir. (ÖK 1)',
          en: 'No published issue; at least one issue must have been published before applying. (ÖK 1)',
        }),
    suggestion: published
      ? ''
      : pick(language, {
          tr: 'Başvurudan önce en az bir sayı yayımlayın.',
          en: 'Publish at least one issue before applying.',
        }),
  });
  return items;
}

export async function validateIdentity(
  data: IdentityData,
  language?: string,
  context?: ValidationContext
): Promise<ReportItem[]> {
  const [homepage, issn] = await Promise.all([
    homepageItems(data.homepageUrl, language),
    issnItems(data, language),
  ]);
  return [...homepage, ...issn, ...metadataItems(data, language, context)];
}
