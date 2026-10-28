import type { ContentData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { declaration, pick } from './shared';

const SECTION = 'Content';

const METADATA_ROUTES: Record<string, { tr: string; en: string }> = {
  dergipark: {
    tr: 'DergiPark üzerinden otomatik aktarım',
    en: 'automatic transfer via DergiPark',
  },
  trdizin_manual: {
    tr: 'TR Dizin’e elle veri girişi',
    en: 'manual data entry into TR Dizin',
  },
  trdizin_xml: {
    tr: 'TR Dizin’e XML ile veri gönderimi',
    en: 'XML metadata submission to TR Dizin',
  },
};

function notApplicable(field: string, ref: string, language: string | undefined): ReportItem {
  return {
    section: SECTION,
    field,
    status: 'pass',
    message: pick(language, {
      tr: `Bu kontrol dergi türü için uygulanmaz. (${ref})`,
      en: `This check does not apply to this type of journal. (${ref})`,
    }),
    suggestion: '',
  };
}

function ratioItems(
  data: ContentData,
  language: string | undefined,
  area: ValidationContext['subjectArea']
): ReportItem[] {
  const items: ReportItem[] = [];
  const reviewType = area === 'review_only' || area === 'case_report_only';
  if (reviewType) {
    return [notApplicable('researchArticleRatio', 'K 10', language)];
  }
  const { researchArticlesLastYear: research, totalScientificArticlesLastYear: total } = data;
  if (!total) {
    items.push({
      section: SECTION,
      field: 'researchArticleRatio',
      status: 'warning',
      message: pick(language, {
        tr: 'Son yıla ait makale sayısı girilmediği için araştırma makalesi oranı hesaplanamadı. (K 10)',
        en: 'No article count for the last year was provided, so the research article ratio could not be calculated. (K 10)',
      }),
      suggestion: pick(language, {
        tr: 'Son yıl yayımlanan toplam bilimsel makale sayısını ve bunların kaçının araştırma makalesi olduğunu girin.',
        en: 'Enter the total number of scientific articles published last year and how many of them are research articles.',
      }),
    });
  } else {
    const pct = Math.round((research / total) * 1000) / 10;
    const ok = research / total >= 0.5;
    items.push({
      section: SECTION,
      field: 'researchArticleRatio',
      status: ok ? 'pass' : 'fail',
      message: pick(language, {
        tr: `Araştırma makalesi oranı %${pct} (${research}/${total}); en az %50 olmalıdır. (K 10)`,
        en: `Research articles make up ${pct}% (${research}/${total}) of the total; at least 50% is required. (K 10)`,
      }),
      suggestion: ok
        ? ''
        : pick(language, {
            tr: 'Dergide yayımlanan bilimsel makalelerin en az yarısı özgün araştırma makalesi olmalıdır.',
            en: 'At least half of the scientific articles published must be original research articles.',
          }),
    });
  }
  if (area === 'health') {
    const ok = research >= 12;
    items.push({
      section: SECTION,
      field: 'researchArticleMinimum',
      status: ok ? 'pass' : 'fail',
      message: pick(language, {
        tr: `Son yılda ${research} araştırma makalesi yayımlanmış; Sağlık Bilimleri dergileri için en az 12 gerekir. (K 10)`,
        en: `${research} research article(s) were published last year; health sciences journals need at least 12. (K 10)`,
      }),
      suggestion: ok
        ? ''
        : pick(language, {
            tr: 'Sağlık Bilimleri dergilerinde yılda en az 12 araştırma makalesi yayımlanmalıdır.',
            en: 'Health sciences journals must publish at least 12 research articles per year.',
          }),
    });
  }
  return items;
}

function specialIssueItems(
  data: ContentData,
  language: string | undefined,
  issuesPerYear: number
): ReportItem[] {
  const allowed = issuesPerYear / 3;
  const allowedShown = Math.floor(allowed);
  const special = data.specialIssuesLastYear;
  const within = special <= allowed;
  const items: ReportItem[] = [
    {
      section: SECTION,
      field: 'specialIssuesLastYear',
      status: within ? 'pass' : 'fail',
      message: within
        ? pick(language, {
            tr: `Son yılda ${special} özel sayı yayımlanmış; izin verilen en fazla sayı ${allowedShown}. (K 18.3)`,
            en: `${special} special issue(s) last year; the allowed maximum is ${allowedShown}. (K 18.3)`,
          })
        : pick(language, {
            tr: `Son yılda ${special} özel sayı yayımlanmış; toplam sayı sayısının üçte birini (en fazla ${allowedShown}) aşıyor. (K 18.3)`,
            en: `${special} special issue(s) last year exceeds one third of the issues (maximum ${allowedShown}). (K 18.3)`,
          }),
      suggestion: within
        ? ''
        : pick(language, {
            tr: 'Özel sayı sayısı yıllık sayı sayısının üçte birini geçmemelidir.',
            en: 'The number of special issues must not exceed one third of the issues per year.',
          }),
    },
  ];
  if (special > 0) {
    items.push(
      declaration({
        section: SECTION,
        field: 'specialIssuesSeparatePaging',
        ok: data.specialIssuesSeparatePaging,
        severity: 'fail',
        language,
        pass: {
          tr: 'Özel sayılar ayrı sayfa numaralandırmasıyla yayımlanıyor. (K 18.2)',
          en: 'Special issues are paginated separately. (K 18.2)',
        },
        fail: {
          tr: 'Özel sayıların ayrı sayfa numaralandırmasıyla yayımlandığı beyan edilmedi. (K 18.2)',
          en: 'It was not declared that special issues are paginated separately. (K 18.2)',
        },
        suggestion: {
          tr: 'Özel sayılara, normal sayılardan bağımsız sayfa numarası verin.',
          en: 'Give special issues their own page numbering, independent of regular issues.',
        },
      })
    );
  } else {
    items.push(notApplicable('specialIssuesSeparatePaging', 'K 18.2', language));
  }
  return items;
}

export async function validateContent(
  data: ContentData,
  language?: string,
  context?: ValidationContext
): Promise<ReportItem[]> {
  const area = context?.subjectArea ?? '';
  const reviewType = area === 'review_only' || area === 'case_report_only';
  const results: ReportItem[] = [
    declaration({
      section: SECTION,
      field: 'publishesOnTime',
      ok: data.publishesOnTime,
      severity: 'fail',
      language,
      pass: {
        tr: 'Dergi sayılarını zamanında yayımlıyor. (K 1)',
        en: 'The journal publishes its issues on schedule. (K 1)',
      },
      fail: {
        tr: 'Derginin sayılarını zamanında yayımladığı beyan edilmedi. (K 1)',
        en: 'It was not declared that the journal publishes its issues on schedule. (K 1)',
      },
      suggestion: {
        tr: 'Sayıları ilan ettiğiniz yayın dönemi içinde yayımlayın; gecikme olan sayıları yayın planına uygun hâle getirin.',
        en: 'Publish issues within the announced schedule and bring delayed issues back in line with it.',
      },
    }),
    ...ratioItems(data, language, area),
    declaration({
      section: SECTION,
      field: 'articleCountsBalanced',
      ok: data.articleCountsBalanced,
      severity: 'warning',
      language,
      pass: {
        tr: 'Sayılardaki makale sayıları dengeli. (K 9)',
        en: 'Article counts per issue are balanced. (K 9)',
      },
      fail: {
        tr: 'Sayılardaki makale sayılarının dengeli olduğu beyan edilmedi. (K 9)',
        en: 'It was not declared that article counts per issue are balanced. (K 9)',
      },
      suggestion: {
        tr: 'Sayılar arasında makale sayısı bakımından büyük farklar oluşmamasına dikkat edin.',
        en: 'Avoid large differences in the number of articles between issues.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'authorInstitutionDiversity',
      ok: data.authorInstitutionDiversity,
      severity: 'warning',
      language,
      pass: {
        tr: 'Makale yazarları farklı kurumlardan geliyor. (K 7)',
        en: 'Article authors come from a diverse set of institutions. (K 7)',
      },
      fail: {
        tr: 'Yazarların farklı kurumlardan geldiği beyan edilmedi. (K 7)',
        en: 'It was not declared that authors come from diverse institutions. (K 7)',
      },
      suggestion: {
        tr: 'Dergiyi yalnızca kendi kurumunuzdaki yazarlara kapalı tutmayın; farklı kurumlardan yazarları çekin.',
        en: 'Do not limit the journal to authors from your own institution; attract authors from other institutions.',
      },
    }),
  ];

  const combined = data.combinedIssuesLast3Years;
  const combinedOk = combined <= 1;
  results.push({
    section: SECTION,
    field: 'combinedIssuesLast3Years',
    status: combinedOk ? 'pass' : 'fail',
    message: pick(
      language,
      combinedOk
        ? {
            tr: `Son 3 yılda ${combined} birleştirilmiş sayı yayımlanmış; en fazla 1 olabilir. (K 17)`,
            en: `${combined} combined issue(s) in the last 3 years; at most 1 is allowed. (K 17)`,
          }
        : {
            tr: `Son 3 yılda ${combined} birleştirilmiş sayı yayımlanmış; en fazla 1 olabilir. (K 17)`,
            en: `${combined} combined issues in the last 3 years exceeds the allowed maximum of 1. (K 17)`,
          }
    ),
    suggestion: combinedOk
      ? ''
      : pick(language, {
          tr: 'Son üç yılda en fazla bir birleştirilmiş sayı (ör. 1-2) yayımlayın; sayıları ayrı ayrı çıkarın.',
          en: 'Publish at most one combined issue (e.g. 1-2) in three years; publish issues separately.',
        }),
  });

  results.push(...specialIssueItems(data, language, context?.issuesPerYear ?? 0));

  if (reviewType) {
    results.push(
      declaration({
        section: SECTION,
        field: 'onlyReviewOrCaseReportStated',
        ok: data.onlyReviewOrCaseReportStated,
        severity: 'fail',
        language,
        pass: {
          tr: 'Dergi yalnızca derleme/olgu sunumu yayımladığını web sitesinde belirtiyor. (Derleme ve Olgu Sunumu Dergileri 1)',
          en: 'The journal states on its website that it publishes only reviews/case reports. (Review and Case Report Journals 1)',
        },
        fail: {
          tr: 'Derginin yalnızca derleme veya olgu sunumu yayımladığının belirtildiği beyan edilmedi. (Derleme ve Olgu Sunumu Dergileri 1)',
          en: 'It was not declared that the journal states it publishes only reviews or case reports. (Review and Case Report Journals 1)',
        },
        suggestion: {
          tr: 'Amaç ve kapsam ile yazım kurallarında dergide yalnızca derleme veya olgu sunumu yayımlandığını açıkça belirtin.',
          en: 'State clearly in the aims and scope and author guidelines that only reviews or case reports are published.',
        },
      })
    );
  } else {
    results.push(notApplicable('onlyReviewOrCaseReportStated', language === 'en' ? 'Review and Case Report Journals 1' : 'Derleme ve Olgu Sunumu Dergileri 1', language));
  }

  const route = data.metadataSubmissionMethod
    ? METADATA_ROUTES[data.metadataSubmissionMethod]
    : undefined;
  results.push({
    section: SECTION,
    field: 'metadataSubmissionMethod',
    status: route ? 'pass' : 'warning',
    message: route
      ? pick(language, {
          tr: `Sayı bilgileri TR Dizin’e şu yolla iletilecek: ${route.tr}. (Sözleşme ${data.metadataSubmissionMethod === 'dergipark' ? '13' : '14'})`,
          en: `Issue metadata will reach TR Dizin via: ${route.en}. (Agreement ${data.metadataSubmissionMethod === 'dergipark' ? '13' : '14'})`,
        })
      : pick(language, {
          tr: 'Sayı bilgilerinin TR Dizin’e hangi yolla iletileceği seçilmedi. (Sözleşme 13, 14)',
          en: 'The route for submitting issue metadata to TR Dizin was not chosen. (Agreement 13, 14)',
        }),
    suggestion: route
      ? ''
      : pick(language, {
          tr: 'DergiPark, TR Dizin’e elle giriş veya XML ile veri gönderimi seçeneklerinden birini seçin.',
          en: 'Choose one of DergiPark, manual entry into TR Dizin, or XML submission.',
        }),
  });
  return results;
}
