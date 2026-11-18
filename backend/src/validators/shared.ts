import type { ScrapeResult } from '../scraper/pageScraper';
import { scrapeUrl } from '../scraper/pageScraper';
import { analyzePageContent } from '../ai/aiClient';
import type { CheckStatus, ReportItem } from '../types/report';

/**
 * Helpers shared by all section validators.
 *
 * Report text is produced in the UI language (Turkish by default, English
 * otherwise) so the report reads naturally for TR Dizin's Turkish-speaking
 * editors. AI criteria strings stay in English because they are instructions
 * for the model, not user-facing text.
 */

export interface Bilingual {
  tr: string;
  en: string;
}

const REF_NUM = '\\d+(?:\\.\\d+)?';
const REF_TOKEN = new RegExp(
  `(?:ÖK|GH|K|T) ${REF_NUM}(?:\\s*[–-]\\s*${REF_NUM})?|Sözleşme \\d+(?:\\s*[/,]\\s*\\d+)*|Başvuru Süreci ${REF_NUM}`,
  'g'
);
const REF_NAMES: Record<string, Bilingual> = {
  ÖK: { tr: 'Ön Koşul', en: 'Prerequisite' },
  K: { tr: 'Kriter', en: 'Criterion' },
  GH: { tr: 'Genel Husus', en: 'General Point' },
  T: { tr: 'Tavsiye', en: 'Recommendation' },
  Sözleşme: { tr: 'Başvuru Sözleşmesi', en: 'Application Agreement' },
  'Başvuru Süreci': { tr: 'Başvuru Süreci', en: 'Application Process' },
};

/**
 * Spell out criterion shorthand for readers. Every parenthesised group made
 * only of codes (`ÖK n`, `K n`, `K 8.2`, `GH n`, `T n`, `Sözleşme 13/14`,
 * ranges and comma lists) is rewritten, e.g. `(ÖK 10–14, GH 8)` becomes
 * `(Ön Koşul 10–14, Genel Husus 8)`. Other parentheses and URLs are untouched.
 */
export function expandRefs(text: string, language?: string): string {
  const lang = language === 'en' ? 'en' : 'tr';
  return text.replace(/\(([^()]*)\)/g, (whole, inner: string) => {
    const rest = inner.replace(REF_TOKEN, '');
    if (rest === inner || /[^\s,;]/.test(rest)) return whole;
    const expanded = inner.replace(REF_TOKEN, (token) => {
      const code = token.startsWith('Sözleşme')
        ? 'Sözleşme'
        : token.startsWith('Başvuru Süreci')
          ? 'Başvuru Süreci'
          : token.slice(0, token.indexOf(' '));
      return `${REF_NAMES[code][lang]}${token.slice(code.length)}`;
    });
    return `(${expanded})`;
  });
}

export function pick(language: string | undefined, text: Bilingual): string {
  return expandRefs(language === 'en' ? text.en : text.tr, language);
}

/** Append a criterion reference such as `(K 15)` to a report message, spelled out for the reader. */
export function withRef(message: string, ref?: string, language?: string): string {
  return ref ? `${message} ${expandRefs(`(${ref})`, language)}` : message;
}

export interface AccessFailure {
  message: string;
  suggestion: string;
}

export function describeAccessFailure(
  url: string,
  scraped: ScrapeResult,
  language?: string,
  ref?: string
): AccessFailure {
  switch (scraped.errorType) {
    case 'timeout':
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresi 15 saniye içinde yanıt vermedi (zaman aşımı). Sayfa yavaş veya geçici olarak erişilemez olabilir; bu, sayfanın eksik olduğunu kanıtlamaz.`,
            en: `The URL ${url} did not respond within 15 seconds (timeout). It may be slow or temporarily down; this is not proof the page is missing.`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'Sayfanın normal bir tarayıcıda hızlı yüklendiğini doğrulayın ve değerlendirmeyi yeniden çalıştırın. Yavaş yüklenen sayfalar TR Dizin uzman incelemesinde de sorun yaratabilir.',
          en: 'Verify the page loads quickly from a regular browser and re-run the assessment. Slow-loading pages may also cause problems during TR Dizin expert review.',
        }),
      };
    case 'http':
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresi HTTP ${scraped.statusCode} döndürdü.`,
            en: `The URL ${url} returned HTTP ${scraped.statusCode}.`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'Kırık bağlantıyı düzeltin: sayfa giriş yapmadan herkese açık olmalı ve HTTP 200 döndürmelidir.',
          en: 'Fix the broken link: the page must be publicly accessible without login and return HTTP 200.',
        }),
      };
    default:
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresine ulaşılamadı (ağ hatası veya geçersiz adres).`,
            en: `The URL ${url} could not be reached (network error or invalid address).`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'URL’de yazım hatası olup olmadığını kontrol edin; sitenin çevrimiçi ve giriş gerektirmeden erişilebilir olduğundan emin olun.',
          en: 'Check the URL for typos and ensure the site is online and publicly accessible without login.',
        }),
      };
  }
}

export interface CheckUrlOptions {
  /** When false, a missing URL yields a warning instead of a fail. */
  required?: boolean;
  /** Criterion reference appended to every message, e.g. `K 15` or `ÖK 9`. */
  ref?: string;
  /** Words that locate the relevant passages on a long page (see `selectPassages`). */
  keywords?: string[];
  /**
   * Build the text sent to the AI from the scrape (for example selected PDF
   * pages). Return `partial: true` when relevant text had to be left out.
   */
  textFrom?: (scraped: ScrapeResult) => string | { text: string; partial: boolean };
  /** Characters of page text sent to the AI; defaults to the AI client's budget. */
  budget?: number;
}

/** " Eksik görünenler: a; b." built from the AI's list of missing elements. */
export function missingList(issues: string[] | undefined, language?: string): string {
  const items = (issues ?? [])
    .map((i) => i.replace(/\s+/g, ' ').trim().replace(/[.;]+$/, ''))
    .filter((i) => i && i.length <= 160)
    .slice(0, 4);
  if (items.length === 0) return '';
  return pick(language, { tr: ` Eksik görünenler: ${items.join('; ')}.`, en: ` Apparently missing: ${items.join('; ')}.` });
}

/** A "not found" on a page the AI saw only in part is a warning, never a fail. */
export function inconclusive(analysis: { found: boolean; skipped?: boolean; partial?: boolean }): boolean {
  return !analysis.found && !analysis.skipped && analysis.partial === true;
}

/**
 * Scrape a URL, run an AI content check against `aiCriteria`, and return a
 * single report item. Inaccessible pages are a fail (HTTP/network) or a
 * warning (timeout); pages where the AI check cannot run are a warning so the
 * editor verifies manually.
 */
export async function checkUrl(
  url: string,
  section: string,
  field: string,
  aiCriteria: string,
  failSuggestion: Bilingual,
  language?: string,
  options: CheckUrlOptions = {}
): Promise<ReportItem> {
  const required = options.required ?? true;
  if (!url) {
    return {
      section,
      field,
      status: required ? 'fail' : 'warning',
      message: withRef(
        pick(language, {
          tr: 'Bu kontrol için URL verilmedi.',
          en: 'No URL was provided for this check.',
        }),
        options.ref,
        language
      ),
      suggestion: pick(language, failSuggestion),
    };
  }
  const scraped = await scrapeUrl(url);
  if (!scraped.accessible) {
    const failure = describeAccessFailure(url, scraped, language, options.ref);
    return {
      section,
      field,
      status: scraped.errorType === 'timeout' ? 'warning' : 'fail',
      message: failure.message,
      suggestion: failure.suggestion,
      url,
    };
  }
  const prepared = options.textFrom ? options.textFrom(scraped) : scraped.text;
  const preparedText = typeof prepared === 'string' ? prepared : prepared.text;
  const preparedPartial = typeof prepared !== 'string' && prepared.partial;
  const analysis = await analyzePageContent({
    pageText: preparedText,
    budget: options.budget,
    pageMeta: scraped.meta,
    criteria: aiCriteria,
    keywords: options.keywords,
    url,
    language,
  });
  const partial = inconclusive({ ...analysis, partial: analysis.partial || preparedPartial });
  const status: CheckStatus = analysis.found ? 'pass' : analysis.skipped || partial ? 'warning' : 'fail';
  const rawMessage = analysis.found
    ? pick(language, {
        tr: `Gerekli içerik ${url} adresinde bulundu.`,
        en: `Required content found at ${url}.`,
      })
    : analysis.skipped
      ? pick(language, {
          tr: `Sayfa erişilebilir, ancak içeriğin yapay zeka ile doğrulanması çalıştırılamadı. ${analysis.evidence}`,
          en: `The page is accessible, but AI verification of its content could not run. ${analysis.evidence}`,
        })
      : partial
        ? pick(language, {
            tr: 'Gerekli içerik sayfanın incelenen bölümlerinde bulunamadı. Sayfa uzun olduğundan bazı bölümler incelenmemiş olabilir, elle doğrulayın.',
            en: 'Required content was not found in the parts of the page that were examined. The page is long, so some parts may not have been examined; please check manually.',
          }) + missingList(analysis.issues, language)
        : pick(language, {
            tr: 'Gerekli içerik bulunamadı.',
            en: 'Required content not found.',
          }) + missingList(analysis.issues, language);
  const message = withRef(rawMessage, options.ref, language);
  const suggestion = analysis.found
    ? ''
    : analysis.skipped
      ? pick(language, {
          tr: `Sayfa içeriğini elle doğrulayın. ${failSuggestion.tr}`,
          en: `Verify the page content manually. ${failSuggestion.en}`,
        })
      : partial
        ? pick(language, {
            tr: `İçeriğin sayfada olduğundan eminseniz bu maddeyi elle doğrulayın. ${failSuggestion.tr}`,
            en: `If you are sure the content is on the page, verify this item manually. ${failSuggestion.en}`,
          })
        : pick(language, failSuggestion);
  return {
    section,
    field,
    status,
    message,
    suggestion,
    url,
    confidence: analysis.skipped ? undefined : partial ? 'low' : analysis.confidence,
    evidence: analysis.skipped ? undefined : analysis.evidence || undefined,
  };
}

export interface DeclarationOptions {
  section: string;
  field: string;
  /** The editor's self-declaration; `undefined` counts as not declared. */
  ok: boolean | undefined;
  /** Status when the declaration is false: hard criterion → fail, recommendation → warning. */
  severity: 'fail' | 'warning';
  language?: string;
  pass: Bilingual;
  fail: Bilingual;
  suggestion: Bilingual;
}

/** Build a report item from a yes/no self-declaration. */
export function declaration(opts: DeclarationOptions): ReportItem {
  const ok = opts.ok === true;
  return {
    section: opts.section,
    field: opts.field,
    status: ok ? 'pass' : opts.severity,
    message: pick(opts.language, ok ? opts.pass : opts.fail),
    suggestion: ok ? '' : pick(opts.language, opts.suggestion),
  };
}
